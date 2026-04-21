import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models.membership import OrganizationMembership
from app.models.user import User

_bearer = HTTPBearer()


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        payload = decode_token(creds.credentials)
        user_id = uuid.UUID(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_superadmin(user: CurrentUser) -> User:
    if not user.is_superadmin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Superadmin access required")
    return user


SuperAdmin = Annotated[User, Depends(require_superadmin)]


def _get_org_membership(user: User, org_id: str, db: Session) -> OrganizationMembership | None:
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        return None
    return db.query(OrganizationMembership).filter_by(user_id=user.id, organization_id=oid).first()


def require_org_admin(org_id: str, user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> User:
    if user.is_superadmin:
        return user
    m = _get_org_membership(user, org_id, db)
    if not m or m.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Organization admin access required")
    return user


def require_org_member(org_id: str, user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> User:
    if user.is_superadmin:
        return user
    m = _get_org_membership(user, org_id, db)
    if not m:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Organization membership required")
    return user
