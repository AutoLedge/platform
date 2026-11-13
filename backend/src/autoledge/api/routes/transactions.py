"""Bank transactions of one business.

GET /businesses/{business_id}/transactions   member: live transactions, newest
                                             first, filtered and paginated

Only live rows: every query filters removed_at IS NULL (soft-deleted rows stay
in the table for reconciliation history, never in this list).
"""

import base64
import binascii
import datetime as dt
import uuid
from typing import Annotated

from fastapi import HTTPException, Query, status
from sqlalchemy import or_, select, tuple_

from autoledge.api.deps import CurrentBusiness, DbSession
from autoledge.api.routers import business_router
from autoledge.models import FinancialAccount, Transaction
from autoledge.schemas.transaction import TransactionPage, TransactionResponse

router = business_router(tags=["transactions"])


def _encode_cursor(date: dt.date, txn_id: uuid.UUID) -> str:
    """Opaque keyset cursor: the (date, id) of the last row returned."""
    return base64.urlsafe_b64encode(f"{date.isoformat()}|{txn_id}".encode()).decode()


def _decode_cursor(cursor: str) -> tuple[dt.date, uuid.UUID]:
    try:
        raw = base64.urlsafe_b64decode(cursor.encode()).decode()
        date_text, id_text = raw.split("|")
        return dt.date.fromisoformat(date_text), uuid.UUID(id_text)
    except (binascii.Error, UnicodeError, ValueError) as exc:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Invalid cursor"
        ) from exc


def _like_pattern(text: str) -> str:
    r"""A substring pattern in which the user's \, % and _ are literal
    (escaped with \, which the query passes as ilike's escape character)."""
    escaped = text.replace("\\", r"\\").replace("%", r"\%").replace("_", r"\_")
    return f"%{escaped}%"


@router.get("/transactions")
def list_transactions(
    ctx: CurrentBusiness,
    db: DbSession,
    date_from: Annotated[dt.date | None, Query(alias="from")] = None,
    date_to: Annotated[dt.date | None, Query(alias="to")] = None,
    account_id: uuid.UUID | None = None,
    pending: bool | None = None,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    cursor: str | None = None,
) -> TransactionPage:
    """The business's live transactions, newest first (date, then id).

    `from` / `to` are inclusive dates; `q` is a case-insensitive substring of
    the description or merchant name. Pass `next_cursor` back as `cursor` for
    the next page.
    """
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="'from' must be on or before 'to'",
        )

    query = (
        select(Transaction, FinancialAccount.name, FinancialAccount.mask)
        .join(FinancialAccount, FinancialAccount.id == Transaction.account_id)
        .where(
            Transaction.business_id == ctx.business.id,
            Transaction.removed_at.is_(None),
        )
    )
    if date_from:
        query = query.where(Transaction.date >= date_from)
    if date_to:
        query = query.where(Transaction.date <= date_to)
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    if pending is not None:
        query = query.where(Transaction.pending.is_(pending))
    if q:
        pattern = _like_pattern(q)
        query = query.where(
            or_(
                Transaction.description.ilike(pattern, escape="\\"),
                Transaction.merchant_name.ilike(pattern, escape="\\"),
            )
        )
    if cursor:
        cursor_date, cursor_id = _decode_cursor(cursor)
        query = query.where(
            tuple_(Transaction.date, Transaction.id) < (cursor_date, cursor_id)
        )

    rows = db.execute(
        query.order_by(Transaction.date.desc(), Transaction.id.desc()).limit(limit + 1)
    ).all()
    more = len(rows) > limit
    rows = rows[:limit]

    items = [
        TransactionResponse(
            id=txn.id,
            account_id=txn.account_id,
            account_name=account_name,
            account_mask=account_mask,
            amount=txn.amount,
            currency=txn.currency,
            date=txn.date,
            pending=txn.pending,
            description=txn.description,
            merchant_name=txn.merchant_name,
            category=txn.category,
        )
        for txn, account_name, account_mask in rows
    ]
    last = rows[-1][0] if more else None
    return TransactionPage(
        items=items,
        next_cursor=_encode_cursor(last.date, last.id) if last else None,
    )
