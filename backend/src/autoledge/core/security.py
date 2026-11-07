"""Verify Supabase access tokens.

Supabase signs access tokens with the project's ES256 key (N9.1). The public
keys are published at {SUPABASE_URL}/auth/v1/.well-known/jwks.json, so no
secret is stored here. Only ES256 is accepted: allowing other algorithms
invites algorithm-confusion attacks.

This module knows about tokens only. Turning a token into a User, and HTTP
status codes, live in autoledge.api.deps.
"""

import uuid
from dataclasses import dataclass
from functools import lru_cache

import jwt

from autoledge.core.config import settings

ALGORITHMS = ["ES256"]
AUDIENCE = "authenticated"


class InvalidTokenError(Exception):
    """The token is missing a claim, expired, wrongly signed, or not for us."""


class AuthUnavailableError(Exception):
    """Supabase's signing keys couldn't be fetched. A server problem, not the
    caller's: report 503, never 401 (a 401 signs the user out)."""


@dataclass(frozen=True)
class TokenClaims:
    user_id: uuid.UUID  # == auth.users.id == profiles.id


def _issuer() -> str:
    return f"{settings.SUPABASE_URL}/auth/v1"


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    # Caches the key set (default 5 minutes). A token whose `kid` isn't in the
    # cached set makes PyJWKClient refetch once, so key rotation needs no
    # deploy.
    return jwt.PyJWKClient(f"{_issuer()}/.well-known/jwks.json")


def verify_access_token(token: str) -> TokenClaims:
    """Return the token's claims, or raise InvalidTokenError / AuthUnavailableError."""
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALGORITHMS,
            audience=AUDIENCE,
            issuer=_issuer(),
            options={"require": ["exp", "sub", "aud", "iss"]},
        )
    except jwt.exceptions.PyJWKClientConnectionError as exc:
        raise AuthUnavailableError from exc
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc

    # AutoLedge doesn't use Supabase anonymous sign-ins.
    if claims.get("is_anonymous"):
        raise InvalidTokenError("anonymous sessions are not accepted")
    try:
        user_id = uuid.UUID(claims["sub"])
    except (TypeError, ValueError) as exc:
        raise InvalidTokenError("sub is not a user id") from exc
    return TokenClaims(user_id=user_id)
