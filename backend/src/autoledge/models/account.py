import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from autoledge.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from autoledge.models.business import Business
    from autoledge.models.plaid import PlaidItem
    from autoledge.models.transaction import Transaction

# Money is stored as exact decimals, never floats. 19 digits with 4 after the
# point covers any business balance and currencies with up to 4 decimals.
# Use the same type for every money column (transactions, invoices).
Money = Numeric(19, 4)


class FinancialAccount(TimestampMixin, Base):
    """One account inside a bank login: a chequing account, a credit card.

    Transactions belong to an account, and forecasting starts from account
    balances. Rows are created and updated from Plaid's /accounts/get (free,
    cached data) and from the accounts array in /transactions/sync responses.

    Rows outlive their Plaid connection on purpose: if the Item is removed or
    Plaid drops the account, the row and its transactions stay so past
    reconciliation results keep pointing at real records.
    """

    __tablename__ = "financial_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    # Stored directly (not only via the Item) for two reasons: access checks
    # become one join shorter, and the account still knows its business after
    # its Item is removed. Sync code must copy it from the Item, never from
    # request input.
    business_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        index=True,
    )

    # The bank login this account came from. SET NULL: removing the Item at
    # Plaid ends syncing but keeps the account and its history.
    plaid_item_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("plaid_items.id", ondelete="SET NULL"),
        index=True,
    )

    # Plaid's account_id: how /transactions/sync results find their account.
    # Usually stable, but Plaid replaces it when it can't reconcile an account
    # ("account churn") or when the bank is linked again; the replacement
    # arrives as a new account and the old id stops being returned.
    plaid_account_id: Mapped[str] = mapped_column(Text, unique=True)

    # What the user sees ("Business Chequing ••4821"). Also, with the
    # institution, how duplicate links and churned accounts are recognised.
    # Plaid's mask is 2-4 characters, may be null, and isn't unique.
    name: Mapped[str] = mapped_column(Text)
    mask: Mapped[str | None] = mapped_column(Text)

    # Plaid's account type: depository, credit, loan, investment or other.
    # Forecasting needs it to read the balance correctly: for depository
    # accounts current_balance is money held; for credit and loan accounts a
    # positive current_balance is money OWED. Stored as text without a CHECK
    # so a new Plaid type can't break syncing.
    type: Mapped[str] = mapped_column(Text)

    # ISO-4217 code (CAD, USD). Reconciliation must only compare amounts in
    # the same currency. Null only for non-ISO currencies such as crypto,
    # which this app doesn't use.
    currency: Mapped[str | None] = mapped_column(Text)

    # Plaid's balances.current: the forecast's starting point. Cached by
    # Plaid, typically refreshed about once a day; may be null.
    current_balance: Mapped[Decimal | None] = mapped_column(Money)

    # When AutoLedge last received current_balance. Per account, because the
    # sync response only includes accounts that had transaction changes, so
    # quiet accounts must be refreshed with /accounts/get.
    balance_as_of: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Set when Plaid stops returning the account (closed, churned, or its
    # Item removed). Null means active. Inactive accounts are excluded from
    # forecasts but kept for reconciliation history.
    inactive_since: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    business: Mapped["Business"] = relationship()
    plaid_item: Mapped["PlaidItem | None"] = relationship(back_populates="accounts")

    # passive_deletes=True: the database's ON DELETE CASCADE removes them.
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"<FinancialAccount id={self.id} name={self.name!r} "
            f"mask={self.mask!r} type={self.type!r}>"
        )