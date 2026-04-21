from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser, SuperAdmin
from app.database import get_db
from app.models.user import User
from app.schemas.user import MeResponse, OrgMembershipInfo, UserOut

router = APIRouter(prefix="/users", tags=["users"])
Db = Annotated[Session, Depends(get_db)]


@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser):
    org_memberships = [
        OrgMembershipInfo(
            organization_id=om.organization_id,
            organization_name=om.organization.name,
            organization_slug=om.organization.slug,
            role=om.role,
        )
        for om in current_user.org_memberships
    ]
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_superadmin=current_user.is_superadmin,
        org_memberships=org_memberships,
    )


@router.get("", response_model=list[UserOut])
def list_users(_: SuperAdmin, db: Db):
    return db.query(User).all()


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, current_user: SuperAdmin, db: Db):
    import uuid as _uuid
    try:
        uid = _uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(404, "User not found")
    if uid == current_user.id:
        raise HTTPException(400, "Cannot delete your own account")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
