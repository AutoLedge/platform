from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from autoledge.core.config import settings
from autoledge.db.session import get_db

app = FastAPI(title="Autoledge API")

# Let the frontend call the API from the browser. Origins come from settings
# (CORS_ORIGINS: the Vite dev server by default; the deployed frontend in
# production). Auth is a Bearer token in the Authorization header, not
# cookies, so credentials stay off and Authorization is an allowed header.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,
    max_age=600,  # browsers may cache a preflight answer for 10 minutes
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Welcome to Autoledge API"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc

    return {"status": "ok", "database": "connected"}
