from logging.config import fileConfig

import autoledge.models  # noqa: F401  registers every table on Base.metadata
from alembic import context
from autoledge.core.config import settings
from autoledge.db.base import Base
from sqlalchemy import create_engine, pool

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# What the models say the schema should be. Autogenerate compares this
# against the live database.
target_metadata = Base.metadata


def include_object(obj, name, type_, reflected, compare_to):
    """Decide what autogenerate is allowed to touch.

    Only the public schema is compared (Alembic's default), so Supabase's
    auth, storage and realtime schemas are never considered. Within public,
    a table that exists in the database but not in our models (made in the
    dashboard, or by an extension) is left alone instead of being dropped.
    """
    if type_ == "table" and reflected and compare_to is None:  # noqa: SIM103
        return False
    return True


def run_migrations_offline() -> None:
    """Write SQL to stdout instead of running it (`alembic upgrade head --sql`)."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Connect to the database and apply migrations."""
    # NullPool: a migration run is one short-lived connection, not a server.
    engine = create_engine(settings.DATABASE_URL, poolclass=pool.NullPool)

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()