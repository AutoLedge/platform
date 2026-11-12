"""Application settings, loaded once at import.

APP_ENV picks the env file, looked up in the backend folder:
    APP_ENV=development (default)  ->  backend/.env.development
    APP_ENV=production             ->  backend/.env.production
Real environment variables always override the file, so a host's secret
settings win over anything on disk. `uv run dev` / `uv run prod` set APP_ENV.
"""

import os
from pathlib import Path
from typing import Annotated, Literal, Self

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

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

    # Supabase project URL (Supabase → Project Settings → API → Project URL),
    # the same value as the frontend's VITE_SUPABASE_URL. N9 builds the JWKS URL
    # and the expected token issuer from it.
    SUPABASE_URL: str

    # Browser origins allowed to call the API (N8). In env files, a
    # comma-separated list: http://localhost:5173,https://app.example.com
    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:5173"]

    # Plaid API credentials (Dashboard → Keys). The client id is the same in every
    # environment; the secret is per environment, so .env.development holds the
    # Sandbox secret and production holds the Production one.
    PLAID_CLIENT_ID: str
    PLAID_SECRET: SecretStr

    # Countries offered in Plaid Link (decision Q1). Comma-separated in env files.
    PLAID_COUNTRY_CODES: Annotated[list[str], NoDecode] = ["CA", "US"]

    # Where Plaid sends webhooks (N16). Unset during day-to-day development
    # (decision Q3: hybrid); set only while testing webhooks through a tunnel,
    # and in production. Must be https.
    PLAID_WEBHOOK_URL: str | None = None

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

    @field_validator("SUPABASE_URL")
    @classmethod
    def _check_supabase_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        local = value.startswith(("http://127.0.0.1", "http://localhost"))
        if not (value.startswith("https://") or local):
            raise ValueError(
                "SUPABASE_URL must start with https:// "
                "(http:// is allowed only for a local Supabase stack)."
            )
        return value

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]
        return value

    @field_validator("PLAID_COUNTRY_CODES", mode="before")
    @classmethod
    def _split_country_codes(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.split(",")
        if isinstance(value, list):
            value = [str(c).strip().upper() for c in value if str(c).strip()]
            if not value:
                raise ValueError("PLAID_COUNTRY_CODES must list at least one country.")
        return value

    @field_validator("PLAID_WEBHOOK_URL", mode="before")
    @classmethod
    def _check_webhook_url(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
            if not value.startswith("https://"):
                raise ValueError("PLAID_WEBHOOK_URL must start with https://.")
        return value

    @model_validator(mode="after")
    def _check_environment(self) -> Self:
        if self.ENVIRONMENT != self.APP_ENV:
            raise ValueError(
                f"ENVIRONMENT={self.ENVIRONMENT!r} but APP_ENV={self.APP_ENV!r}: "
                f"backend/.env.{self.APP_ENV} contains another environment's settings."
            )
        if self.ENVIRONMENT == "production":
            if self.DEBUG:
                raise ValueError("DEBUG must be false in production.")
            local = [
                o for o in self.CORS_ORIGINS if "localhost" in o or "127.0.0.1" in o
            ]
            if not self.CORS_ORIGINS or local:
                raise ValueError(
                    "CORS_ORIGINS must list the production frontend URL(s) and no "
                    f"localhost origins in production (got {self.CORS_ORIGINS})."
                )
        return self


settings = Settings()  # pyright: ignore[reportCallIssue]
