"""Router factories. Every new router starts from one of these, so its routes
are protected by default.

    user_router()      signed-in user required            (e.g. /me, /businesses)
    business_router()  /businesses/{business_id}/..., member of that business
    APIRouter()        public: health checks only

Routes that also need the objects declare them as parameters (CurrentUser,
CurrentBusiness, OwnerBusiness from autoledge.api.deps). FastAPI resolves
each dependency once per request, so that costs no extra queries.

Data rules for every route:
    - user_id / business_id for ownership come only from these dependencies,
      never from a request body.
    - Child rows are looked up by both their own id and the business id, so a
      child id from another business is a 404.
"""

from typing import Any

from fastapi import APIRouter, Depends

from autoledge.api.deps import get_current_business, get_current_user


def user_router(**kwargs: Any) -> APIRouter:
    return APIRouter(dependencies=[Depends(get_current_user)], **kwargs)


def business_router(**kwargs: Any) -> APIRouter:
    return APIRouter(
        prefix="/businesses/{business_id}",
        dependencies=[Depends(get_current_business)],
        **kwargs,
    )
