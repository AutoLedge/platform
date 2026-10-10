import uuid
from datetime import datetime

from autoledge.db.base import Base
from sqlalchemy import Column, DateTime, ForeignKey, MetaData, Table, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

# Supabase Auth owns auth.users. We describe just its id column, in a separate
# MetaData, so our FK can point at it while create_all() and Alembic never try
# to create or alter it.
auth_users = Table(
    "users",
    MetaData(),
    Column("id", Uuid, primary_key=True),
    schema="auth",
)


class User(Base):
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

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"