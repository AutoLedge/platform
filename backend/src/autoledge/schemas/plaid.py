from datetime import datetime

from pydantic import BaseModel


class LinkTokenResponse(BaseModel):
    """A Plaid Link token for the frontend to open Link with. Short-lived."""

    link_token: str
    expiration: datetime
