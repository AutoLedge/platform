"""Application settings, loaded once at import.

APP_ENV picks the env file, looked up in the backend folder:
    APP_ENV=development (default)  ->  backend/.env.development
    APP_ENV=production             ->  backend/.env.production
Real environment variables always override the file, so a host's secret
settings win over anything on disk. `uv run dev` / `uv run prod` set APP_ENV.
"""

import os
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# src/autoledge/core/config.py -> parents: core, autoledge, src, backend
BACKEND_DIR = Path(__file__).resolve().parents[3]
APP_ENVS = ("development", "production")


def _env_file() -> Path:
    app_env = os.environ.get("APP_ENV", "development")
    if app_env not in APP_ENVS:
        raise RuntimeError(
            f"APP_ENV must be 'development' or 'production', got {app_env!r}."
        )
    path = BACKEND_DIR / f".env.{app_env}"
    if app_env == "development" and not path.exists():
        if (BACKEND_DIR / ".env").exists():
            raise RuntimeError(
                "Found backend/.env but not backend/.env.development. "
                "Rename it: Rename-Item .env .env.development"
            )
    return path


class Settings(BaseSettings):
    ENVIRONMENT: str
    DEBUG: bool
    DATABASE_URL: str
    PLAID_TOKEN_ENCRYPTION_KEY: SecretStr

    model_config = SettingsConfigDict(
        env_file=_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()  # pyright: ignore[reportCallIssue]
