import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Text,
    Uuid,
    false,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from autoledge.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from autoledge.models.account import FinancialAccount
    from autoledge.models.business import Business


class PlaidEnvironment(enum.StrEnum):
    SANDBOX = "sandbox"  # Plaid's test environment; fake banks, no billing
    PRODUCTION = "production"  # real banks; tokens are billed


class PlaidItem(TimestampMixin, Base):
    """One bank login a business connected through Plaid Link.

    A single Item can cover several accounts at the same institution
    (FinancialAccount rows, added next). Plaid issues the access token and the
    transactions sync cursor per Item, which is why this table exists at all.

    Only what syncing, reconciliation and forecasting need is stored here;
    everything else about the Item can be fetched from /item/get on demand.
    """

    __tablename__ = "plaid_items"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    # RESTRICT, not CASCADE: a business can't be deleted while it still has
    # Items. Plaid keeps billing for an Item until /item/remove is called, so
    # the service must remove each Item at Plaid first, then delete the row.
    business_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="RESTRICT"),
        index=True,
    )

    # Plaid's ID for the Item. Every Item webhook carries it, so this is how a
    # webhook finds its row. Linking the same bank twice creates a new item_id,
    # so uniqueness here doesn't prevent duplicate links; the link flow must.
    plaid_item_id: Mapped[str] = mapped_column(Text, unique=True)

    # The access token never expires and grants read access to the bank login,
    # so it is stored only as Fernet ciphertext (see core/crypto.py), with the
    # key kept outside the database. deferred: ordinary queries don't load it;
    # it is fetched only when code reads this attribute.
    access_token_ciphertext: Mapped[str] = mapped_column(Text, deferred=True)

    # Which Plaid environment issued the access token. A token only works in
    # the environment that issued it, so the Plaid service must refuse to use a
    # token whose environment differs from the running app's (settings, N6).
    # Text plus a CHECK, like MembershipRole, so adding a value is a migration
    # that replaces plaid_items_plaid_environment_check.
    plaid_environment: Mapped[PlaidEnvironment] = mapped_column(
        Enum(
            PlaidEnvironment,
            native_enum=False,
            create_constraint=False,
            length=20,
            values_callable=lambda envs: [e.value for e in envs],
        ),
    )

    # From Link's onSuccess metadata. Shown in the UI ("Reconnect RBC") and used
    # with account name + mask to spot duplicate links before exchanging the
    # public token. Plaid returns null for Items without an institution.
    institution_id: Mapped[str | None] = mapped_column(Text)
    institution_name: Mapped[str | None] = mapped_column(Text)

    # /transactions/sync bookmark. Null until the first completed sync; omit
    # the cursor on that first call. Save it only after every page (has_more
    # is false) has been written, in the same DB transaction as the rows.
    transactions_cursor: Mapped[str | None] = mapped_column(Text)

    # False until Plaid reports HISTORICAL_UPDATE_COMPLETE. Before then only
    # about the last 30 days are available, so forecasts built on this Item
    # should say their history is incomplete.
    history_complete: Mapped[bool] = mapped_column(
        Boolean,
        server_default=false(),
    )

    # Null when the Item is healthy. Otherwise the Plaid code that means the
    # user must reconnect through Link update mode: ITEM_LOGIN_REQUIRED,
    # PENDING_DISCONNECT or USER_PERMISSION_REVOKED. Cleared on LOGIN_REPAIRED
    # or after a successful update-mode session.
    needs_update_reason: Mapped[str | None] = mapped_column(Text)

    # When a sync last finished. Reconciliation and forecasts use it to say how
    # current their data is.
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    business: Mapped["Business"] = relationship(back_populates="plaid_items")

    # passive_deletes=True: when an Item row is deleted, the database's
    # ON DELETE SET NULL detaches its accounts; SQLAlchemy doesn't load them.
    accounts: Mapped[list["FinancialAccount"]] = relationship(
        back_populates="plaid_item",
        passive_deletes=True,
    )

    __table_args__ = (
        # Only known environments. Named "plaid_environment" ->
        # plaid_items_plaid_environment_check. Autogenerate won't notice if
        # PlaidEnvironment changes: replace this constraint in a migration.
        CheckConstraint(
            "plaid_environment in ({})".format(
                ", ".join(f"'{e.value}'" for e in PlaidEnvironment)
            ),
            name="plaid_environment",
        ),
    )

    def __repr__(self) -> str:
        # Never include the access token.
        return (
            f"<PlaidItem id={self.id} plaid_item_id={self.plaid_item_id!r} "
            f"environment={self.plaid_environment} "
            f"institution={self.institution_name!r}>"
        )
