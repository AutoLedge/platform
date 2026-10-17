from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr

class Settings(BaseSettings):
    ENVIRONMENT: str
    DEBUG: bool
    DATABASE_URL: str
    PLAID_TOKEN_ENCRYPTION_KEY: SecretStr

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings() # pyright: ignore[reportCallIssue]