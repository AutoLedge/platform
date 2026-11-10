import uuid
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from autoledge.models import MembershipRole

BusinessName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]


class BusinessCreate(BaseModel):
    """Body of POST /businesses. The creator becomes the owner: the owner is
    never taken from the body, so unknown fields (owner_id, role, id) are
    rejected with 422."""

    model_config = ConfigDict(extra="forbid")

    name: BusinessName


class BusinessResponse(BaseModel):
    """A business the caller belongs to, and their role in it."""

    id: uuid.UUID
    name: str
    role: MembershipRole
