from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Match the constraint names Postgres (and the Supabase dashboard) generate by
# default, so tables made in code and tables made in the dashboard look alike.
NAMING_CONVENTION = {
    "pk": "%(table_name)s_pkey",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ix": "%(table_name)s_%(column_0_name)s_idx",
    "ck": "%(table_name)s_%(constraint_name)s_check",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)