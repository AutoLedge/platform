"""Bank connections through Plaid, for one business.

POST /businesses/{business_id}/plaid/link-token   owner: start Plaid Link
POST /businesses/{business_id}/plaid/items        owner: store a connection
GET  /businesses/{business_id}/plaid/items        member: list connections
DELETE /businesses/{business_id}/plaid/items/{id} owner: remove a connection

Plaid failures are logged by the service (codes only) and reported to the
client as a generic 502, so no Plaid detail reaches the browser.
"""

import logging
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from autoledge.api.deps import CurrentBusiness, CurrentUser, DbSession, OwnerBusiness
from autoledge.api.routers import business_router
from autoledge.core.config import settings
from autoledge.core.crypto import encrypt_access_token
from autoledge.models import FinancialAccount, PlaidItem
from autoledge.schemas.plaid import (
    AccountResponse,
    LinkTokenResponse,
    PlaidItemCreate,
    PlaidItemResponse,
)
from autoledge.services import plaid as plaid_service

logger = logging.getLogger(__name__)

router = business_router(tags=["plaid"])

SERVICE_UNAVAILABLE = "Bank connection service unavailable"
ALREADY_CONNECTED = "This bank is already connected"
LINK_EXPIRED = "Bank connection expired, try again"
WRONG_ENVIRONMENT = "This connection belongs to another Plaid environment"


def _unavailable() -> HTTPException:
    return HTTPException(status.HTTP_502_BAD_GATEWAY, detail=SERVICE_UNAVAILABLE)


def _already_connected() -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, detail=ALREADY_CONNECTED)


def _plaid_error(exc: Exception) -> HTTPException | None:
    """The HTTP error for a Plaid service exception, or None if it isn't one."""
    if isinstance(exc, plaid_service.PlaidEnvironmentMismatch):
        return HTTPException(status.HTTP_409_CONFLICT, detail=WRONG_ENVIRONMENT)
    if isinstance(exc, plaid_service.PlaidServiceError):
        if exc.error_code == "INVALID_PUBLIC_TOKEN":
            return HTTPException(status.HTTP_400_BAD_REQUEST, detail=LINK_EXPIRED)
        return _unavailable()
    return None


def account_response(account: FinancialAccount) -> AccountResponse:
    return AccountResponse(
        id=account.id,
        name=account.name,
        mask=account.mask,
        type=account.type,
        currency=account.currency,
        current_balance=account.current_balance,
        balance_as_of=account.balance_as_of,
        connected=account.plaid_item_id is not None,
        inactive_since=account.inactive_since,
    )


def item_response(item: PlaidItem) -> PlaidItemResponse:
    """Never reads access_token_ciphertext, so the deferred column stays unloaded."""
    return PlaidItemResponse(
        id=item.id,
        institution_id=item.institution_id,
        institution_name=item.institution_name,
        status="needs_attention" if item.needs_update_reason else "ok",
        needs_update_reason=item.needs_update_reason,
        history_complete=item.history_complete,
        last_synced_at=item.last_synced_at,
        created_at=item.created_at,
        accounts=[
            account_response(a) for a in sorted(item.accounts, key=lambda a: a.name)
        ],
    )


def _institution_connected(
    db: Session, business_id: uuid.UUID, institution_id: str
) -> bool:
    return (
        db.scalar(
            select(PlaidItem.id).where(
                PlaidItem.business_id == business_id,
                PlaidItem.institution_id == institution_id,
            )
        )
        is not None
    )


@router.post("/plaid/link-token")
def create_link_token(ctx: OwnerBusiness, user: CurrentUser) -> LinkTokenResponse:
    """A short-lived Plaid Link token for connecting a bank to this business."""
    try:
        link_token, expiration = plaid_service.create_link_token(user_id=user.id)
    except plaid_service.PlaidServiceError as exc:
        raise _unavailable() from exc
    return LinkTokenResponse(link_token=link_token, expiration=expiration)


def _store_connection(
    db: Session, business_id: uuid.UUID, access_token: str, plaid_item_id: str
) -> uuid.UUID:
    """Steps after the exchange: trusted duplicate check, institution and
    accounts from Plaid, then one DB transaction. Returns the new item's id."""
    institution_id = plaid_service.get_item_institution(access_token)
    if institution_id and _institution_connected(db, business_id, institution_id):
        raise _already_connected()

    institution_name = (
        plaid_service.get_institution_name(institution_id) if institution_id else None
    )
    accounts = plaid_service.get_accounts(access_token)

    item = PlaidItem(
        business_id=business_id,
        plaid_item_id=plaid_item_id,
        access_token_ciphertext=encrypt_access_token(access_token),
        plaid_environment=settings.PLAID_ENVIRONMENT,
        institution_id=institution_id,
        institution_name=institution_name,
    )
    db.add(item)
    db.flush()  # assigns item.id (server-generated)

    existing = {
        a.plaid_account_id: a
        for a in db.scalars(
            select(FinancialAccount).where(
                FinancialAccount.plaid_account_id.in_(
                    [a["account_id"] for a in accounts]
                )
            )
        )
    }
    now = datetime.now(UTC)
    for data in accounts:
        account = existing.get(data["account_id"])
        if account is None:
            account = FinancialAccount(
                business_id=item.business_id,  # from the item, never the request
                plaid_account_id=data["account_id"],
            )
            db.add(account)
        elif account.business_id != item.business_id:
            # Plaid account ids are unique per item, so this shouldn't happen.
            logger.error(
                "Plaid account %s already belongs to another business", account.id
            )
            raise _already_connected()
        account.plaid_item_id = item.id
        account.name = data["name"]
        account.mask = data["mask"]
        account.type = data["type"]
        account.currency = data["iso_currency_code"]
        account.current_balance = data["current"]
        account.balance_as_of = now
        account.inactive_since = None

    db.commit()  # the item and its accounts together, or neither
    return item.id


@router.post("/plaid/items", status_code=status.HTTP_201_CREATED)
def create_item(
    body: PlaidItemCreate, ctx: OwnerBusiness, db: DbSession
) -> PlaidItemResponse:
    """Store a bank connection from Plaid Link's public token, with its accounts.

    Every item exchanged at Plaid is either stored here or removed at Plaid,
    so a failure never leaves a billed orphan behind.
    """
    business_id = ctx.business.id

    # Cheap pre-check on Link's metadata: nothing is exchanged for a duplicate.
    if body.institution_id and _institution_connected(
        db, business_id, body.institution_id
    ):
        raise _already_connected()

    try:
        access_token, plaid_item_id = plaid_service.exchange_public_token(
            body.public_token
        )
    except plaid_service.PlaidServiceError as exc:
        raise (_plaid_error(exc) or _unavailable()) from exc

    try:
        item_id = _store_connection(db, business_id, access_token, plaid_item_id)
    except Exception as exc:
        db.rollback()
        try:
            plaid_service.remove_item(access_token)
        except Exception as remove_exc:  # best effort: report the original error
            logger.error(
                "Could not remove orphan Plaid item: %s error_code=%s",
                type(remove_exc).__name__,
                getattr(remove_exc, "error_code", None),
            )
        http_error = _plaid_error(exc)
        if http_error is not None:
            raise http_error from exc
        raise

    item = db.get_one(PlaidItem, item_id)
    return item_response(item)


@router.get("/plaid/items")
def list_items(ctx: CurrentBusiness, db: DbSession) -> list[PlaidItemResponse]:
    """The business's bank connections, newest first, each with its accounts."""
    items = db.scalars(
        select(PlaidItem)
        .where(PlaidItem.business_id == ctx.business.id)
        .options(selectinload(PlaidItem.accounts))
        .order_by(PlaidItem.created_at.desc(), PlaidItem.id)
    ).all()
    return [item_response(item) for item in items]


@router.delete("/plaid/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: uuid.UUID, ctx: OwnerBusiness, db: DbSession) -> None:
    """Remove a connection at Plaid and here. Its accounts and their
    transactions stay, marked inactive and detached from the connection."""
    item = db.scalar(
        select(PlaidItem)
        .where(PlaidItem.id == item_id, PlaidItem.business_id == ctx.business.id)
        .options(selectinload(PlaidItem.accounts))
    )
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Connection not found")

    # Plaid first: if it fails, nothing changes here and the owner can retry.
    try:
        plaid_service.remove_item(plaid_service.access_token_for(item))
    except (
        plaid_service.PlaidEnvironmentMismatch,
        plaid_service.PlaidServiceError,
    ) as exc:
        raise (_plaid_error(exc) or _unavailable()) from exc

    # Before the delete: ON DELETE SET NULL then detaches the accounts.
    now = datetime.now(UTC)
    for account in item.accounts:
        account.inactive_since = now
    db.flush()
    db.delete(item)
    db.commit()
