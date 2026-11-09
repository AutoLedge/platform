"""Businesses the signed-in user belongs to.

router         /businesses              list mine, create one (user_router)
scoped_router  /businesses/{business_id} one business I'm a member of
                                        (business_router: 404 otherwise)
"""

from fastapi import status
from sqlalchemy import select

from autoledge.api.deps import CurrentBusiness, CurrentUser, DbSession
from autoledge.api.routers import business_router, user_router
from autoledge.models import Business, BusinessMembership, MembershipRole
from autoledge.schemas.business import BusinessCreate, BusinessResponse

router = user_router(prefix="/businesses", tags=["businesses"])
scoped_router = business_router(tags=["businesses"])


@router.get("")
def list_my_businesses(user: CurrentUser, db: DbSession) -> list[BusinessResponse]:
    rows = db.execute(
        select(Business, BusinessMembership.role)
        .join(BusinessMembership, BusinessMembership.business_id == Business.id)
        .where(BusinessMembership.user_id == user.id)
        .order_by(Business.created_at, Business.id)
    ).all()
    return [
        BusinessResponse(id=business.id, name=business.name, role=role)
        for business, role in rows
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_business(
    body: BusinessCreate, user: CurrentUser, db: DbSession
) -> BusinessResponse:
    """Create a business with the caller as its owner, in one transaction."""
    business = Business(name=body.name)
    db.add(business)
    db.flush()  # assigns business.id (server-generated)
    db.add(
        BusinessMembership(
            business_id=business.id,
            user_id=user.id,
            role=MembershipRole.OWNER,
        )
    )
    response = BusinessResponse(
        id=business.id, name=business.name, role=MembershipRole.OWNER
    )
    db.commit()  # business and owner membership together, or neither
    return response


@scoped_router.get("")
def get_business(ctx: CurrentBusiness) -> BusinessResponse:
    return BusinessResponse(id=ctx.business.id, name=ctx.business.name, role=ctx.role)
