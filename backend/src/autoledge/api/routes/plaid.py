"""Bank connections through Plaid, for one business.

POST /businesses/{business_id}/plaid/link-token   owner: start Plaid Link

Plaid failures are logged by the service (codes only) and reported to the
client as a generic 502, so no Plaid detail reaches the browser.
"""

from fastapi import HTTPException, status

from autoledge.api.deps import CurrentUser, OwnerBusiness
from autoledge.api.routers import business_router
from autoledge.schemas.plaid import LinkTokenResponse
from autoledge.services import plaid as plaid_service

router = business_router(tags=["plaid"])

SERVICE_UNAVAILABLE = "Bank connection service unavailable"


def _unavailable() -> HTTPException:
    return HTTPException(status.HTTP_502_BAD_GATEWAY, detail=SERVICE_UNAVAILABLE)


@router.post("/plaid/link-token")
def create_link_token(ctx: OwnerBusiness, user: CurrentUser) -> LinkTokenResponse:
    """A short-lived Plaid Link token for connecting a bank to this business."""
    try:
        link_token, expiration = plaid_service.create_link_token(user_id=user.id)
    except plaid_service.PlaidServiceError as exc:
        raise _unavailable() from exc
    return LinkTokenResponse(link_token=link_token, expiration=expiration)
