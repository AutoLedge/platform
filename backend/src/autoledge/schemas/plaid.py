import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class LinkTokenResponse(BaseModel):
    """A Plaid Link token for the frontend to open Link with. Short-lived."""

    link_token: str
    expiration: datetime


class PlaidItemCreate(BaseModel):
    """Body of POST …/plaid/items, from Plaid Link's onSuccess.
    institution_id is Link metadata, used only to refuse an obvious duplicate
    before exchanging; Plaid's own /item/get is the source of truth after."""

    model_config = ConfigDict(extra="forbid")

    public_token: NonEmptyStr
    institution_id: str | None = None


class AccountResponse(BaseModel):
    """One bank account. Never includes Plaid's account id."""

    id: uuid.UUID
    name: str
    mask: str | None
    type: str
    currency: str | None
    current_balance: Decimal | None
    balance_as_of: datetime | None
    connected: bool  # still attached to a Plaid connection
    inactive_since: datetime | None


class PlaidItemResponse(BaseModel):
    """One bank connection and its accounts. `id` is AutoLedge's id, never
    Plaid's item_id; no token or sync cursor is ever included."""

    id: uuid.UUID
    institution_id: str | None
    institution_name: str | None
    status: Literal["ok", "needs_attention"]
    needs_update_reason: str | None
    history_complete: bool
    last_synced_at: datetime | None
    created_at: datetime
    accounts: list[AccountResponse]


class SyncResponse(BaseModel):
    """Result of a manual sync: Plaid's change counts and the connection after it."""

    added: int
    modified: int
    removed: int
    item: PlaidItemResponse
