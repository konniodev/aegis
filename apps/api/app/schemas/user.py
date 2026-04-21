import uuid
from pydantic import BaseModel


class OrgMembershipInfo(BaseModel):
    organization_id: uuid.UUID
    organization_name: str
    organization_slug: str
    role: str


class MeResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_superadmin: bool
    org_memberships: list[OrgMembershipInfo]


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_superadmin: bool
    is_active: bool

    model_config = {"from_attributes": True}


class MemberOut(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    role: str


class InviteRequest(BaseModel):
    email: str
    full_name: str = ""
    role: str = "member"
