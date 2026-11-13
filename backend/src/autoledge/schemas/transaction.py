import datetime as dt
import uuid
from decimal import Decimal

from pydantic import BaseModel


class TransactionResponse(BaseModel):
    """One live bank transaction. amount keeps Plaid's sign: positive = money
    out of the account, negative = money in. Never includes Plaid's ids."""

    id: uuid.UUID
    account_id: uuid.UUID
    account_name: str
    account_mask: str | None
    amount: Decimal
    currency: str | None
    date: dt.date
    pending: bool
    description: str
    merchant_name: str | None
    category: str | None


class TransactionPage(BaseModel):
    items: list[TransactionResponse]
    # Pass back as ?cursor= for the next page; null = last page.
    next_cursor: str | None
