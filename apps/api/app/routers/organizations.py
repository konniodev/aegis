import re
import secrets
import string
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.constants import RESERVED_SLUGS
from app.core.deps import CurrentUser, SuperAdmin, require_org_admin, require_org_member
from app.core.security import hash_password
from app.database import get_db
from app.models.membership import OrganizationMembership
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrgCreate, OrgOut, OrgSettingsUpdate, OrgUpdate
from app.schemas.user import InviteRequest, MemberOut

router = APIRouter(prefix="/organizations", tags=["organizations"])
Db = Annotated[Session, Depends(get_db)]

_SLUG_RE = re.compile(r"^[a-z0-9-]{3,100}$")


def _validate_slug(slug: str) -> None:
    if not _SLUG_RE.match(slug):
        raise HTTPException(422, "Slug must be 3-100 lowercase letters, digits, or hyphens")
    if slug in RESERVED_SLUGS:
        raise HTTPException(422, f"'{slug}' is a reserved slug")


def _get_org_or_404(org_id: str, db: Session) -> Organization:
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(404, "Organization not found")
    org = db.get(Organization, oid)
    if not org:
        raise HTTPException(404, "Organization not found")
    return org


# ── Org CRUD (superadmin) ─────────────────────────────────────────────────────

@router.get("", response_model=list[OrgOut])
def list_orgs(_: SuperAdmin, db: Db):
    return db.query(Organization).all()


@router.post("", response_model=OrgOut, status_code=201)
def create_org(payload: OrgCreate, _: SuperAdmin, db: Db):
    _validate_slug(payload.slug)
    if db.query(Organization).filter_by(slug=payload.slug).first():
        raise HTTPException(409, "Slug already taken")
    org = Organization(name=payload.name, slug=payload.slug)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/slug/{slug}", response_model=OrgOut)
def get_org_by_slug(slug: str, current_user: CurrentUser, db: Db):
    org = db.query(Organization).filter_by(slug=slug).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    if not current_user.is_superadmin:
        m = db.query(OrganizationMembership).filter_by(
            user_id=current_user.id, organization_id=org.id
        ).first()
        if not m:
            raise HTTPException(403, "Access denied")
    return org


@router.get("/{org_id}", response_model=OrgOut)
def get_org(org_id: str, _: SuperAdmin, db: Db):
    return _get_org_or_404(org_id, db)


@router.patch("/{org_id}", response_model=OrgOut)
def update_org(org_id: str, payload: OrgUpdate, _: SuperAdmin, db: Db):
    org = _get_org_or_404(org_id, db)
    for field in ("name", "is_active", "address", "countries", "industries"):
        value = getattr(payload, field)
        if value is not None:
            setattr(org, field, value)
    db.commit()
    db.refresh(org)
    return org


@router.patch("/slug/{slug}/settings", response_model=OrgOut)
def update_org_settings(slug: str, payload: OrgSettingsUpdate, current_user: CurrentUser, db: Db):
    org = db.query(Organization).filter_by(slug=slug).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    if not current_user.is_superadmin:
        m = db.query(OrganizationMembership).filter_by(
            user_id=current_user.id, organization_id=org.id
        ).first()
        if not m or m.role != "admin":
            raise HTTPException(403, "Organization admin access required")
    for field in ("name", "address", "countries", "industries"):
        value = getattr(payload, field)
        if value is not None:
            setattr(org, field, value)
    db.commit()
    db.refresh(org)
    return org


# ── Org members ───────────────────────────────────────────────────────────────

@router.get("/{org_id}/members", response_model=list[MemberOut])
def list_members(
    org_id: str,
    _: Annotated[User, Depends(require_org_member)],
    db: Db,
):
    _get_org_or_404(org_id, db)
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(404, "Organization not found")
    memberships = db.query(OrganizationMembership).filter_by(organization_id=oid).all()
    return [
        MemberOut(user_id=str(m.user_id), email=m.user.email, full_name=m.user.full_name, role=m.role)
        for m in memberships
    ]


@router.post("/{org_id}/members", status_code=201)
def invite_member(
    org_id: str,
    payload: InviteRequest,
    _: Annotated[User, Depends(require_org_admin)],
    db: Db,
):
    _get_org_or_404(org_id, db)
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(404, "Not found")

    user = db.query(User).filter_by(email=payload.email).first()
    if not user:
        temp_pw = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
        user = User(
            email=payload.email,
            full_name=payload.full_name or payload.email.split("@")[0],
            hashed_password=hash_password(temp_pw),
        )
        db.add(user)
        db.flush()

    existing = db.query(OrganizationMembership).filter_by(user_id=user.id, organization_id=oid).first()
    if existing:
        existing.role = payload.role
    else:
        db.add(OrganizationMembership(user_id=user.id, organization_id=oid, role=payload.role))
    db.commit()
    return {"user_id": str(user.id), "email": user.email}


@router.patch("/{org_id}/members/{user_id}")
def update_member_role(
    org_id: str,
    user_id: str,
    payload: InviteRequest,
    _: Annotated[User, Depends(require_org_admin)],
    db: Db,
):
    try:
        oid, uid = uuid.UUID(org_id), uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    m = db.query(OrganizationMembership).filter_by(user_id=uid, organization_id=oid).first()
    if not m:
        raise HTTPException(404, "Member not found")
    m.role = payload.role
    db.commit()
    return {"role": m.role}


@router.delete("/{org_id}/members/{user_id}", status_code=204)
def remove_member(
    org_id: str,
    user_id: str,
    _: Annotated[User, Depends(require_org_admin)],
    db: Db,
):
    try:
        oid, uid = uuid.UUID(org_id), uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    m = db.query(OrganizationMembership).filter_by(user_id=uid, organization_id=oid).first()
    if m:
        db.delete(m)
        db.commit()
