import uuid

from pydantic import BaseModel, ConfigDict


class ProfileResponse(BaseModel):
    """The signed-in user's own profile."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str | None
