"""Encryption for secrets stored in the database (Plaid access tokens).

Fernet (from the `cryptography` package) gives authenticated symmetric
encryption: ciphertext can't be read or altered without the key. The key lives
only in the environment (settings.plaid_token_encryption_key), never in the
database, so a leaked dump or backup doesn't expose working bank access.

Use a different key per environment. If the key is lost, every stored token is
unreadable and every bank must be re-linked, so keep it in a password manager
as well as the deployment's secret settings.
"""

from functools import lru_cache

from cryptography.fernet import Fernet

from autoledge.core.config import settings


@lru_cache
def _fernet() -> Fernet:
    return Fernet(settings.PLAID_TOKEN_ENCRYPTION_KEY.get_secret_value())


def encrypt_access_token(access_token: str) -> str:
    return _fernet().encrypt(access_token.encode()).decode()


def decrypt_access_token(ciphertext: str) -> str:
    # Raises cryptography.fernet.InvalidToken if the key is wrong or the
    # ciphertext was altered.
    return _fernet().decrypt(ciphertext.encode()).decode()