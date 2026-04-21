import uuid
from datetime import datetime
from pydantic import BaseModel


class InstanceCreate(BaseModel):
    name: str
    slug: str


class InstanceUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class InstanceOut(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
