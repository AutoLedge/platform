"""Plaid API access. The only module that talks to Plaid.

Everything Plaid-specific stays here: routes call these functions and never
see plaid-python types, access tokens or Plaid errors directly.
"""

import json
import logging
from collections.abc import Callable
from functools import lru_cache
from typing import Any

import plaid
from plaid.api import plaid_api

from autoledge.core.config import settings
from autoledge.core.crypto import decrypt_access_token
from autoledge.models import PlaidEnvironment, PlaidItem

logger = logging.getLogger(__name__)


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
