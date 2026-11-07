"""Application settings, loaded once at import.

APP_ENV picks the env file, looked up in the backend folder:
    APP_ENV=development (default)  ->  backend/.env.development
    APP_ENV=production             ->  backend/.env.production
Real environment variables always override the file, so a host's secret
settings win over anything on disk. `uv run dev` / `uv run prod` set APP_ENV.
"""

import os
from pathlib import Path
from typing import Literal, Self

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from autoledge.models.plaid import PlaidEnvironment

# src/autoledge/core/config.py -> parents: core, autoledge, src, backend
BACKEND_DIR = Path(__file__).resolve().parents[3]
APP_ENVS = ("development", "production")
AppEnv = Literal["development", "production"]


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
    # Which env file was loaded (set by `uv run dev` / `uv run prod`). Must match
    # ENVIRONMENT inside the file, which catches a production file copied as dev.
    APP_ENV: AppEnv = "development"
    ENVIRONMENT: AppEnv
    DEBUG: bool = False
    DATABASE_URL: SecretStr
    PLAID_TOKEN_ENCRYPTION_KEY: SecretStr

    model_config = SettingsConfigDict(
        env_file=_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def PLAID_ENVIRONMENT(self) -> PlaidEnvironment:
        """Sandbox everywhere except production. The Plaid service must refuse
        a stored token whose plaid_environment differs from this (Data Model)."""
        if self.ENVIRONMENT == "production":
            return PlaidEnvironment.PRODUCTION
        return PlaidEnvironment.SANDBOX

    @model_validator(mode="after")
    def _check_environment(self) -> Self:
        if self.ENVIRONMENT != self.APP_ENV:
            raise ValueError(
                f"ENVIRONMENT={self.ENVIRONMENT!r} but APP_ENV={self.APP_ENV!r}: "
                f"backend/.env.{self.APP_ENV} contains another environment's settings."
            )
        if self.ENVIRONMENT == "production" and self.DEBUG:
            raise ValueError("DEBUG must be false in production.")
        return self


settings = Settings()  # pyright: ignore[reportCallIssue]
