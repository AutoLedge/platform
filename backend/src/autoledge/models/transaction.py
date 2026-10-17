import datetime as dt
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Index, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from autoledge.db.base import Base, TimestampMixin
from autoledge.models.account import Money

if TYPE_CHECKING:
    from autoledge.models.account import FinancialAccount


class Transaction(TimestampMixin, Base):
    """One bank transaction imported from Plaid's /transactions/sync.

    Rows mirror Plaid exactly: `added` inserts, `modified` updates the row with
    the same plaid_transaction_id, `removed` deletes it. When a pending
    transaction posts, Plaid REMOVES the pending one and ADDS a new posted one
    with a different id, so a pending row never turns into a posted row here.
    """

    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    # Copied from the account by sync code (never from request input) so that
    # access checks and per-business date queries need no joins.
    business_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("financial_accounts.id", ondelete="CASCADE"),
    )

    # Plaid's transaction_id: how `modified` and `removed` find the row.
    plaid_transaction_id: Mapped[str] = mapped_column(Text, unique=True)

    # Plaid's sign convention, unchanged: POSITIVE = money OUT of the account
    # (purchases, bills paid), NEGATIVE = money IN (deposits, refunds,
    # customer payments). A bill payment is positive; a customer paying an
    # invoice you issued is negative.
    amount: Mapped[Decimal] = mapped_column(Money)

    # ISO-4217 code. Reconciliation compares only same-currency amounts.
    currency: Mapped[str | None] = mapped_column(Text)

    # Posted date for posted transactions; date it happened for pending ones.
    # The matching window and forecast time series both use it. (dt.date, not
    # date, so the attribute name can't shadow the type in the annotation.)
    date: Mapped[dt.date] = mapped_column(Date)

    # Pending amounts and names can still change (a tip added) and some
    # pending holds never post. Forecasting counts pending as committed cash;
    # reconciliation matches only posted transactions.
    pending: Mapped[bool] = mapped_column(Boolean)

    # The bank's raw description (Plaid's original_description, requested
    # with include_original_description=true). Matching searches it for
    # invoice numbers and payer names, e.g. "E-TRANSFER INV-1043 ACME LTD".
    description: Mapped[str] = mapped_column(Text)

    # Plaid's cleaned merchant name ("Staples"), null when Plaid can't tell.
    # Matched against an invoice's vendor or customer name.
    merchant_name: Mapped[str | None] = mapped_column(Text)

    # Plaid's personal_finance_category.detailed, e.g. TRANSFER_OUT_ACCOUNT_TRANSFER
    # or RENT_AND_UTILITIES_RENT. The broad category is its prefix. Used to
    # leave transfers between the business's own accounts out of matching and
    # forecasts, and to group recurring costs for forecasting.
    category: Mapped[str | None] = mapped_column(Text)

    account: Mapped["FinancialAccount"] = relationship(back_populates="transactions")

    __table_args__ = (
        # "This business's transactions in a date range": dashboards, matching
        # windows, forecast history.
        Index("transactions_business_id_date_idx", "business_id", "date"),
        # "This account's transactions in a date range". Also serves the
        # account_id foreign key.
        Index("transactions_account_id_date_idx", "account_id", "date"),
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction id={self.id} date={self.date} amount={self.amount} "
            f"pending={self.pending} description={self.description!r}>"
        )