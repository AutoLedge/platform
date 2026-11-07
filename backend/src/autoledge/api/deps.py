"""FastAPI dependencies: database session, signed-in user, business access.

Routes import from here, never from core.security or db.session directly:

    DbSession       a request-scoped SQLAlchemy session
    CurrentUser     the verified, signed-in User (401 otherwise)
    CurrentBusiness the business in the path + the caller's role (404 if not a member)
    OwnerBusiness   the same, but only for the business owner (403 otherwise)

FastAPI resolves each dependency once per request, so a route can ask for
CurrentUser and CurrentBusiness and they share one user lookup and one session.
"""

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from autoledge.core.security import (
    AuthUnavailableError,
    InvalidTokenError,
    verify_access_token,
)
from autoledge.db.session import get_db
from autoledge.models import Business, BusinessMembership, MembershipRole, User

DbSession = Annotated[Session, Depends(get_db)]

# auto_error=False: a missing header is reported by get_current_user as 401
# (HTTPBearer's own error status has varied between FastAPI versions).
bearer = HTTPBearer(auto_error=False, description="Supabase access token")


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: DbSession,
) -> User:
    """The signed-in user, from a verified Supabase access token."""
    if credentials is None:
        raise _unauthorized("Not authenticated")
    try:
        claims = verify_access_token(credentials.credentials)
    except AuthUnavailableError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is temporarily unavailable",
        ) from exc
    except InvalidTokenError as exc:
        raise _unauthorized("Invalid or expired token") from exc

    # The sign-up trigger creates a profile for every auth user, so a missing
    # profile means the user was deleted: treat the token as invalid.
    user = db.get(User, claims.user_id)
    if user is None:
        raise _unauthorized("Invalid or expired token")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


@dataclass(frozen=True)
class BusinessContext:
    """The business named in the request path, and the caller's role in it."""

    business: Business
    role: MembershipRole

    @property
    def is_owner(self) -> bool:
        return self.role is MembershipRole.OWNER


def get_current_business(
    business_id: uuid.UUID,  # from the path: /businesses/{business_id}/...
    user: CurrentUser,
    db: DbSession,
) -> BusinessContext:
    """The business in the path, if the caller is a member. 404 otherwise.

    Non-members and unknown ids get the same 404, so the API never confirms
    that another business exists. There is no server-side "current business":
    every business-scoped request names its business in the path.
    """
    row = db.execute(
        select(Business, BusinessMembership.role)
        .join(BusinessMembership, BusinessMembership.business_id == Business.id)
        .where(
            Business.id == business_id,
            BusinessMembership.user_id == user.id,
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Business not found")
    business, role = row
    return BusinessContext(business=business, role=role)


CurrentBusiness = Annotated[BusinessContext, Depends(get_current_business)]


def require_owner(ctx: CurrentBusiness) -> BusinessContext:
    """Owner-only actions (bank connections, members). 403 for other members."""
    if not ctx.is_owner:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can do this",
        )
    return ctx


OwnerBusiness = Annotated[BusinessContext, Depends(require_owner)]
