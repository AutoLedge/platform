"""The signed-in user's own profile."""

from autoledge.api.deps import CurrentUser
from autoledge.api.routers import user_router
from autoledge.schemas.user import ProfileResponse

router = user_router(tags=["me"])


@router.get("/me")
def get_me(user: CurrentUser) -> ProfileResponse:
    return ProfileResponse.model_validate(user)
