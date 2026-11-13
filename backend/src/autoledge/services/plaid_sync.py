"""Transaction sync: Plaid's /transactions/sync into the database.

Two halves:

1. The pure half, with no database and no network: collect_changes() pages
   through Plaid and nets all pages into one change set; transaction_values()
   maps a Plaid transaction to `transactions` columns.
2. sync_item(): locks the item, applies the change set in one DB transaction,
   then saves the cursor in the same commit.

This module never imports plaid-python: Plaid data arrives as plain values
from services/plaid.py.
"""

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from autoledge.models import FinancialAccount, PlaidItem, Transaction
from autoledge.services import plaid as plaid_service
from autoledge.services.plaid import PlaidServiceError, SyncPage

logger = logging.getLogger(__name__)

MUTATION_DURING_PAGINATION = "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION"
MAX_ATTEMPTS = 3

# Rows per INSERT ... ON CONFLICT / UPDATE statement.
CHUNK_SIZE = 500

# Item errors a sync can hit that only the user can fix (Link update mode).
USER_ACTION_ERRORS = frozenset(
    {
        "ITEM_LOGIN_REQUIRED",
        "ITEM_LOCKED",
        "USER_SETUP_REQUIRED",
        "INSUFFICIENT_CREDENTIALS",
        "ACCESS_NOT_GRANTED",
        "NO_ACCOUNTS",
    }
)

# Columns an upsert overwrites on an existing row (Plaid's `modified`).
UPSERT_COLUMNS = (
    "account_id",
    "amount",
    "currency",
    "date",
    "pending",
    "description",
    "merchant_name",
    "category",
)


# --- Pure half ---------------------------------------------------------------


@dataclass
class SyncChanges:
    """Every page of one sync, netted into the final state per transaction."""

    upserts: dict[str, dict[str, Any]] = field(default_factory=dict)
    removed: set[str] = field(default_factory=set)
    accounts: dict[str, dict[str, Any]] = field(default_factory=dict)
    next_cursor: str | None = None
    update_status: str | None = None
    added_count: int = 0
    modified_count: int = 0
    removed_count: int = 0


def _merge(changes: SyncChanges, page: SyncPage) -> None:
    # In page order, so a later page wins: an id that is added then removed
    # ends up removed; removed then re-added ends up as an upsert.
    for txn in [*page.added, *page.modified]:
        txn_id = txn["transaction_id"]
        changes.removed.discard(txn_id)
        changes.upserts[txn_id] = txn
    for txn_id in page.removed:
        changes.upserts.pop(txn_id, None)
        changes.removed.add(txn_id)
    for account in page.accounts:
        changes.accounts[account["account_id"]] = account
    changes.added_count += len(page.added)
    changes.modified_count += len(page.modified)
    changes.removed_count += len(page.removed)
    changes.update_status = page.update_status


def collect_changes(
    fetch_page: Callable[[str | None], SyncPage],
    cursor: str | None,
    *,
    max_attempts: int = MAX_ATTEMPTS,
) -> SyncChanges:
    """Every page from `cursor` until has_more is false.

    If Plaid reports that data changed mid-way, everything collected so far is
    dropped and the sync restarts from the original cursor, as Plaid requires.
    """
    for attempt in range(1, max_attempts + 1):
        changes = SyncChanges()
        page_cursor = cursor
        try:
            while True:
                page = fetch_page(page_cursor)
                _merge(changes, page)
                page_cursor = page.next_cursor
                if not page.has_more:
                    break
        except PlaidServiceError as exc:
            if exc.error_code != MUTATION_DURING_PAGINATION or attempt == max_attempts:
                raise
            logger.info(
                "Transactions changed during sync; restarting (attempt %s)",
                attempt + 1,
            )
            continue
        changes.next_cursor = page_cursor or None  # "" (nothing ready) -> NULL
        return changes
    raise AssertionError("unreachable")


def transaction_values(txn: dict[str, Any]) -> dict[str, Any]:
    """A Plaid transaction (plain values) -> `transactions` columns. Never
    sets business_id or account_id: those come from the account."""
    return {
        "amount": txn["amount"],  # Plaid sign: positive = money out
        "currency": txn["iso_currency_code"],
        "date": txn["date"],
        "pending": txn["pending"],
        # The bank's raw text, which matching searches; Plaid's cleaned name
        # as a fallback; the column is NOT NULL.
        "description": txn["original_description"] or txn["name"] or "",
        "merchant_name": txn["merchant_name"],
        "category": txn["category"],
    }


# --- DB half -----------------------------------------------------------------


class SyncAlreadyRunning(Exception):
    """Another sync of this item holds its lock; this one did nothing."""


class ItemNeedsUpdate(Exception):
    """Plaid needs the user to reconnect the item (Link update mode)."""

    def __init__(self, error_code: str) -> None:
        self.error_code = error_code
        super().__init__(f"Item needs update: {error_code}")


class AccountBusinessMismatch(Exception):
    """A Plaid account in the response is stored under another business."""


@dataclass(frozen=True)
class SyncResult:
    added: int
    modified: int
    removed: int


def _chunks[T](values: list[T]) -> list[list[T]]:
    return [values[i : i + CHUNK_SIZE] for i in range(0, len(values), CHUNK_SIZE)]


def _try_lock(db: Session, item: PlaidItem) -> bool:
    # Transaction-scoped: released on commit or rollback, so also on errors.
    # Unlike a row lock it doesn't block other writes to the plaid_items row.
    return bool(
        db.scalar(
            select(
                func.pg_try_advisory_xact_lock(
                    func.hashtextextended(f"plaid_sync:{item.id}", 0)
                )
            )
        )
    )


def _apply_accounts(
    db: Session, item: PlaidItem, changes: SyncChanges, now: datetime
) -> dict[str, FinancialAccount]:
    """Create or update the response's accounts. Returns every known account
    the change set refers to, by Plaid account id."""
    wanted = set(changes.accounts) | {
        txn["account_id"] for txn in changes.upserts.values()
    }
    accounts = {
        a.plaid_account_id: a
        for a in db.scalars(
            select(FinancialAccount).where(
                FinancialAccount.plaid_account_id.in_(wanted)
            )
        )
    }
    for plaid_account_id, data in changes.accounts.items():
        account = accounts.get(plaid_account_id)
        if account is None:
            account = FinancialAccount(
                business_id=item.business_id,  # from the item, never Plaid
                plaid_item_id=item.id,
                plaid_account_id=plaid_account_id,
            )
            db.add(account)
            accounts[plaid_account_id] = account
        elif account.business_id != item.business_id:
            logger.error("Plaid account %s belongs to another business", account.id)
            raise AccountBusinessMismatch(str(account.id))
        account.name = data["name"]
        account.mask = data["mask"]
        account.type = data["type"]
        account.currency = data["iso_currency_code"]
        account.current_balance = data["current"]
        account.balance_as_of = now
        account.plaid_item_id = item.id
        account.inactive_since = None
    db.flush()  # assigns ids to new accounts
    return accounts


def _apply_changes(
    db: Session, item: PlaidItem, changes: SyncChanges, now: datetime
) -> None:
    accounts = _apply_accounts(db, item, changes, now)

    rows: list[dict[str, Any]] = []
    skipped = 0
    for txn_id, txn in changes.upserts.items():
        account = accounts.get(txn["account_id"])
        if account is None or account.business_id != item.business_id:
            skipped += 1
            continue
        rows.append(
            {
                "business_id": item.business_id,
                "account_id": account.id,
                "plaid_transaction_id": txn_id,
                **transaction_values(txn),
            }
        )
    if skipped:
        logger.warning("Skipped %s transactions with no account here", skipped)

    for chunk in _chunks(rows):
        stmt = pg_insert(Transaction).values(chunk)
        stmt = stmt.on_conflict_do_update(
            index_elements=[Transaction.plaid_transaction_id],
            set_={
                **{c: stmt.excluded[c] for c in UPSERT_COLUMNS},
                "removed_at": None,  # re-added -> live again
                "updated_at": func.now(),  # bulk SQL bypasses the ORM's onupdate
            },
            # Never touch another business's row (Plaid ids are unique per
            # item, so this can't match, but the guard costs nothing).
            where=Transaction.business_id == stmt.excluded.business_id,
        )
        db.execute(stmt)

    for chunk in _chunks(sorted(changes.removed)):
        db.execute(
            update(Transaction)
            .where(
                Transaction.plaid_transaction_id.in_(chunk),
                Transaction.business_id == item.business_id,
                Transaction.removed_at.is_(None),
            )
            .values(removed_at=now, updated_at=func.now())
            .execution_options(synchronize_session=False)
        )

    item.transactions_cursor = changes.next_cursor
    item.last_synced_at = now
    if changes.update_status == "HISTORICAL_UPDATE_COMPLETE":
        item.history_complete = True
    if item.needs_update_reason in USER_ACTION_ERRORS:
        # A successful sync proves the login works again. Other reasons (such
        # as N16's PENDING_EXPIRATION) aren't about the login: leave them.
        item.needs_update_reason = None


def sync_item(db: Session, item: PlaidItem) -> SyncResult:
    """Pull every change since the item's cursor and apply it in one commit.

    Commits or rolls back `db`; call it with no uncommitted work in the session.
    Raises SyncAlreadyRunning, ItemNeedsUpdate, PlaidEnvironmentMismatch or
    PlaidServiceError; on any error nothing changes and the cursor stays put
    (except ItemNeedsUpdate, which records needs_update_reason).
    """
    if not _try_lock(db, item):
        db.rollback()
        raise SyncAlreadyRunning
    try:
        db.refresh(item)  # the cursor as of now, not from before the lock
        now = datetime.now(UTC)
        token = plaid_service.access_token_for(item)
        changes = collect_changes(
            lambda c: plaid_service.sync_transactions_page(token, c),
            item.transactions_cursor,
        )
        _apply_changes(db, item, changes, now)
        db.commit()  # the cursor and every row together, or nothing
    except PlaidServiceError as exc:
        db.rollback()
        if exc.error_code in USER_ACTION_ERRORS:
            item.needs_update_reason = exc.error_code
            db.commit()
            logger.warning("Sync needs the user: error_code=%s", exc.error_code)
            raise ItemNeedsUpdate(exc.error_code) from None
        raise
    except Exception:
        db.rollback()
        raise
    return SyncResult(
        added=changes.added_count,
        modified=changes.modified_count,
        removed=changes.removed_count,
    )
