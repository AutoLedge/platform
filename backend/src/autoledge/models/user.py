import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, MetaData, Table, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from autoledge.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from autoledge.models.business import BusinessMembership

# Supabase Auth owns auth.users. We describe just its id column, in a separate
# MetaData, so our FK can point at it while create_all() and Alembic never try
# to create or alter it.
auth_users = Table(
    "users",
    MetaData(),
    Column("id", Uuid, primary_key=True),
    schema="auth",
)


class User(TimestampMixin, Base):
    """App-side data for a person who signs in.

    Supabase Auth stores credentials in auth.users; this table (public.profiles,
    the Supabase convention) holds everything the app needs about that person.
    The primary key IS the auth user's id, so there is exactly one profile per
    auth user and no separate id to keep in sync.
    """

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(auth_users.c.id, ondelete="CASCADE"),
        primary_key=True,
    )
    email: Mapped[str] = mapped_column(Text)
    full_name: Mapped[str | None] = mapped_column(Text)

    # The businesses this person belongs to, through their memberships.
    memberships: Mapped[list["BusinessMembership"]] = relationship(
        back_populates="user",
        passive_deletes=True,
    )
    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"