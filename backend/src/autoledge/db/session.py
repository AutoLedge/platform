from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from autoledge.core.config import settings

engine = create_engine(
    settings.DATABASE_URL.get_secret_value(),
    pool_pre_ping=True,
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
