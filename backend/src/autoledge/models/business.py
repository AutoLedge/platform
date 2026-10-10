import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, Text, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from autoledge.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from autoledge.models.user import User


class MembershipRole(enum.StrEnum):
    OWNER = "owner"    # one per business; manages bank connections and members
    MEMBER = "member"  # works with the business's data


class Business(TimestampMixin, Base):
    """A company whose finances AutoLedge manages.

    Every financial record (bank connections, accounts, transactions, invoices)
    belongs to a business, never directly to a user. Who may see it is decided
    by business_memberships.
    """

    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(Text)

    memberships: Mapped[list["BusinessMembership"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Business id={self.id} name={self.name!r}>"


class BusinessMembership(TimestampMixin, Base):
    """Says that a user belongs to a business, and in what role.

    The primary key is the pair (business_id, user_id), so a person can't be
    added to the same business twice. Removing someone deletes the row.
    """

    __tablename__ = "business_memberships"

    business_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        primary_key=True,
    )
    # Indexed on its own: the primary key's index starts with business_id, so
    # it can't serve "which businesses does this user belong to?".
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    # Stored as plain text rather than a native Postgres enum type, which is
    # much easier to change in later migrations. The allowed values are
    # enforced by the CheckConstraint in __table_args__ below.
    role: Mapped[MembershipRole] = mapped_column(
        Enum(
            MembershipRole,
            native_enum=False,
            create_constraint=False,
            length=20,
            values_callable=lambda roles: [r.value for r in roles],
        ),
    )

    business: Mapped[Business] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship(back_populates="memberships")

    __table_args__ = (
        # Only known roles. Declared here once, instead of letting Enum create
        # it, because Enum(create_constraint=True) makes Alembic emit the CHECK
        # several times. Named "role" → business_memberships_role_check.
        # Autogenerate won't notice if MembershipRole changes: add a migration
        # that drops and recreates this constraint by hand.
        CheckConstraint(
            "role in ({})".format(", ".join(f"'{r.value}'" for r in MembershipRole)),
            name="role",
        ),
        # At most one owner per business: a unique index over only the rows
        # where role = 'owner'.
        Index(
            "business_memberships_one_owner_idx",
            "business_id",
            unique=True,
            postgresql_where=text("role = 'owner'"),
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<BusinessMembership business_id={self.business_id} "
            f"user_id={self.user_id} role={self.role}>"
        )