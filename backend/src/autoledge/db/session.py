from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from autoledge.core.config import settings

# Sized for Supabase's session pooler, where every pooled connection holds a
# real database connection from the project's shared limit. Worst case per
# process is pool_size + max_overflow = 10. Multiply by uvicorn workers and
# instances before raising either number (README: Connection budget).
engine = create_engine(
    settings.DATABASE_URL.get_secret_value(),
    pool_pre_ping=True,  # test a connection before use; replaces dropped ones
    pool_size=5,  # connections kept open
    max_overflow=5,  # extra connections allowed under load, closed after use
    pool_recycle=1800,  # replace connections after 30 min, before the pooler
    # or network drops them while idle
    connect_args={"application_name": "autoledge"},  # label in pg_stat_activity
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
