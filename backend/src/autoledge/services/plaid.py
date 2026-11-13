"""Plaid API access. The only module that talks to Plaid.

Everything Plaid-specific stays here: routes call these functions and never
see plaid-python types, access tokens or Plaid errors directly.
"""

import json
import logging
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from functools import lru_cache
from typing import Any

import plaid
from plaid.api import plaid_api
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.institutions_get_by_id_request import InstitutionsGetByIdRequest
from plaid.model.item_get_request import ItemGetRequest
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.item_remove_request import ItemRemoveRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.link_token_transactions import LinkTokenTransactions
from plaid.model.products import Products
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.transactions_sync_request_options import (
    TransactionsSyncRequestOptions,
)

from autoledge.core.config import settings
from autoledge.core.crypto import decrypt_access_token
from autoledge.models import PlaidEnvironment, PlaidItem

logger = logging.getLogger(__name__)

# Days of transaction history to request when an item is linked (decision Q2).
# Set at link time only: it can't be raised for an item afterwards.
TRANSACTIONS_DAYS_REQUESTED = 180

SYNC_PAGE_SIZE = 500  # Plaid's maximum per /transactions/sync call


class PlaidServiceError(Exception):
    """A Plaid API call failed. Carries only Plaid's error classification.

    Never holds the request, the response body or any token, so it is safe to
    log or chain.
    """

    def __init__(
        self,
        error_code: str | None,
        error_type: str | None,
        request_id: str | None = None,
    ) -> None:
        self.error_code = error_code
        self.error_type = error_type
        self.request_id = request_id
        super().__init__(f"Plaid error {error_type}/{error_code}")

    def __str__(self) -> str:
        return (
            f"Plaid error {self.error_type}/{self.error_code} "
            f"(request_id={self.request_id})"
        )


class PlaidEnvironmentMismatch(Exception):
    """The item's token was issued by another Plaid environment than the app's."""

    def __init__(self, item_environment: PlaidEnvironment) -> None:
        self.item_environment = item_environment
        super().__init__(
            f"Item belongs to Plaid {item_environment}, "
            f"app runs against Plaid {settings.PLAID_ENVIRONMENT}"
        )


@lru_cache
def client() -> plaid_api.PlaidApi:
    host = (
        plaid.Environment.Sandbox
        if settings.PLAID_ENVIRONMENT == PlaidEnvironment.SANDBOX
        else plaid.Environment.Production
    )
    configuration = plaid.Configuration(
        host=host,
        api_key={
            "clientId": settings.PLAID_CLIENT_ID,
            "secret": settings.PLAID_SECRET.get_secret_value(),
        },
    )
    return plaid_api.PlaidApi(plaid.ApiClient(configuration))


def access_token_for(item: PlaidItem) -> str:
    """The item's usable access token. The only way code gets one.

    Checks the environment first: a token only works in the Plaid environment
    that issued it, so a mismatch is refused before decrypting.
    """
    if item.plaid_environment != settings.PLAID_ENVIRONMENT:
        raise PlaidEnvironmentMismatch(item.plaid_environment)
    return decrypt_access_token(item.access_token_ciphertext)


def _error_fields(exc: plaid.ApiException) -> tuple[str | None, str | None, str | None]:
    try:
        body = json.loads(exc.body) if exc.body else {}
    except TypeError, ValueError:
        body = {}
    if not isinstance(body, dict):
        body = {}
    return body.get("error_code"), body.get("error_type"), body.get("request_id")


def _call[T](fn: Callable[[Any], T], request: Any) -> T:
    """Run one SDK call, turning Plaid errors into PlaidServiceError.

    Logs only Plaid's error type, code and request id: never the request or
    response, which can contain tokens.
    """
    try:
        return fn(request)
    except plaid.ApiException as exc:
        error_code, error_type, request_id = _error_fields(exc)
        logger.warning(
            "Plaid call %s failed: status=%s error_type=%s error_code=%s request_id=%s",
            getattr(fn, "__name__", "?"),
            exc.status,
            error_type,
            error_code,
            request_id,
        )
        # from None: the ApiException's text includes the response body.
        raise PlaidServiceError(error_code, error_type, request_id) from None


def create_link_token(*, user_id: uuid.UUID) -> tuple[str, datetime]:
    """A Link token for this user: transactions, the configured countries,
    180 days of history. Returns (link_token, expiration)."""
    kwargs: dict[str, Any] = {}
    if settings.PLAID_WEBHOOK_URL:
        kwargs["webhook"] = settings.PLAID_WEBHOOK_URL
    request = LinkTokenCreateRequest(
        client_name="AutoLedge",
        language="en",
        country_codes=[CountryCode(code) for code in settings.PLAID_COUNTRY_CODES],
        user=LinkTokenCreateRequestUser(client_user_id=str(user_id)),
        products=[Products("transactions")],
        transactions=LinkTokenTransactions(days_requested=TRANSACTIONS_DAYS_REQUESTED),
        **kwargs,
    )
    response = _call(client().link_token_create, request)
    return response.link_token, response.expiration


def exchange_public_token(public_token: str) -> tuple[str, str]:
    """Exchange Link's public token. Returns (access_token, plaid_item_id).

    From this point Plaid has a live item: the caller must either store it or
    call remove_item.
    """
    response = _call(
        client().item_public_token_exchange,
        ItemPublicTokenExchangeRequest(public_token=public_token),
    )
    return response.access_token, response.item_id


def get_item_institution(access_token: str) -> str | None:
    """The item's institution id from /item/get (null for some items)."""
    response = _call(client().item_get, ItemGetRequest(access_token=access_token))
    return response.item.get("institution_id")


def get_institution_name(institution_id: str) -> str | None:
    """The institution's display name, or None if Plaid can't say. Cosmetic,
    so errors are logged by _call and swallowed."""
    request = InstitutionsGetByIdRequest(
        institution_id=institution_id,
        country_codes=[CountryCode(code) for code in settings.PLAID_COUNTRY_CODES],
    )
    try:
        response = _call(client().institutions_get_by_id, request)
    except PlaidServiceError:
        return None
    return response.institution.get("name")


def _enum_value(value: Any) -> str:
    return str(getattr(value, "value", value))


def _decimal(value: float | None) -> Decimal | None:
    # Via str: Decimal(0.1) would carry the float's binary error.
    return None if value is None else Decimal(str(value))


def _account_values(account: Any) -> dict[str, Any]:
    """A Plaid account as plain values: account_id, name, mask, type,
    iso_currency_code, current (Decimal)."""
    return {
        "account_id": account.account_id,
        "name": account.name,
        "mask": account.get("mask"),
        "type": _enum_value(account.type),
        "iso_currency_code": account.balances.get("iso_currency_code"),
        "current": _decimal(account.balances.get("current")),
    }


def get_accounts(access_token: str) -> list[dict[str, Any]]:
    """The item's accounts from /accounts/get, as _account_values() dicts."""
    response = _call(
        client().accounts_get, AccountsGetRequest(access_token=access_token)
    )
    return [_account_values(account) for account in response.accounts]


def remove_item(access_token: str) -> None:
    """Remove the item at Plaid, which ends billing and invalidates the token.
    An item Plaid no longer knows (ITEM_NOT_FOUND) counts as removed."""
    try:
        _call(client().item_remove, ItemRemoveRequest(access_token=access_token))
    except PlaidServiceError as exc:
        if exc.error_code != "ITEM_NOT_FOUND":
            raise
    logger.info("Plaid item removed")


@dataclass(frozen=True)
class SyncPage:
    """One /transactions/sync response as plain values (no SDK types)."""

    added: list[dict[str, Any]]  # _transaction_values() dicts
    modified: list[dict[str, Any]]
    removed: list[str]  # Plaid transaction ids
    accounts: list[dict[str, Any]]  # same shape as get_accounts()
    next_cursor: str  # "" when Plaid has nothing ready yet
    has_more: bool
    update_status: str | None  # transactions_update_status, e.g. NOT_READY


def _transaction_values(txn: Any) -> dict[str, Any]:
    """A Plaid transaction as plain values, under Plaid's own field names.
    amount keeps Plaid's sign (positive = money out)."""
    category = txn.get("personal_finance_category")
    return {
        "transaction_id": txn.transaction_id,
        "account_id": txn.account_id,
        "amount": _decimal(txn.amount),
        "iso_currency_code": txn.get("iso_currency_code"),
        "date": txn.date,
        "pending": txn.pending,
        "name": txn.get("name"),
        "original_description": txn.get("original_description"),
        "merchant_name": txn.get("merchant_name"),
        "category": category.get("detailed") if category else None,
    }


def sync_transactions_page(access_token: str, cursor: str | None) -> SyncPage:
    """One page of /transactions/sync after `cursor` (from the beginning when
    the cursor is None or empty)."""
    kwargs: dict[str, Any] = {}
    if cursor:  # omitted = from the beginning; None or "" must not be sent
        kwargs["cursor"] = cursor
    request = TransactionsSyncRequest(
        access_token=access_token,
        count=SYNC_PAGE_SIZE,
        options=TransactionsSyncRequestOptions(include_original_description=True),
        **kwargs,
    )
    response = _call(client().transactions_sync, request)
    status = response.get("transactions_update_status")
    return SyncPage(
        added=[_transaction_values(t) for t in response.added],
        modified=[_transaction_values(t) for t in response.modified],
        removed=[r.transaction_id for r in response.removed],
        accounts=[_account_values(a) for a in response.accounts],
        next_cursor=response.next_cursor,
        has_more=response.has_more,
        update_status=_enum_value(status) if status is not None else None,
    )
