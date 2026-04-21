import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator


class OrgCreate(BaseModel):
    name: str
    slug: str


class OrgSettingsUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    countries: list[str] | None = None
    industries: list[str] | None = None


class OrgUpdate(OrgSettingsUpdate):
    is_active: bool | None = None


class OrgOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    is_active: bool
    created_at: datetime
    address: str | None = None
    countries: list[str] = []
    industries: list[str] = []

    model_config = {"from_attributes": True}

    @field_validator("countries", "industries", mode="before")
    @classmethod
    def none_to_empty_list(cls, v: object) -> list:
        return v if v is not None else []
