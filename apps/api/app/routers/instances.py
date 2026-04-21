import re
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser, require_instance_admin, require_org_admin, require_org_member
from app.database import get_db
from app.models.instance import Instance
from app.models.membership import InstanceMembership, OrganizationMembership
from app.models.user import User
from app.schemas.instance import InstanceCreate, InstanceOut, InstanceUpdate
from app.schemas.user import InviteRequest, MemberOut

router = APIRouter(prefix="/organizations/{org_id}/instances", tags=["instances"])
Db = Annotated[Session, Depends(get_db)]

_SLUG_RE = re.compile(r"^[a-z0-9-]{3,100}$")


def _get_instance_or_404(org_id: str, instance_id: str, db: Session) -> Instance:
    try:
        oid, iid = uuid.UUID(org_id), uuid.UUID(instance_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    inst = db.query(Instance).filter_by(id=iid, organization_id=oid).first()
    if not inst:
        raise HTTPException(404, "Instance not found")
    return inst


# ── Instance CRUD ─────────────────────────────────────────────────────────────

@router.get("", response_model=list[InstanceOut])
def list_instances(
    org_id: str,
    _: Annotated[User, Depends(require_org_member)],
    db: Db,
):
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    return db.query(Instance).filter_by(organization_id=oid).all()


@router.post("", response_model=InstanceOut, status_code=201)
def create_instance(
    org_id: str,
    payload: InstanceCreate,
    _: Annotated[User, Depends(require_org_admin)],
    db: Db,
):
    if not _SLUG_RE.match(payload.slug):
        raise HTTPException(422, "Slug must be 3-100 lowercase letters, digits, or hyphens")
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    if db.query(Instance).filter_by(organization_id=oid, slug=payload.slug).first():
        raise HTTPException(409, "Slug already taken in this organization")
    inst = Instance(organization_id=oid, name=payload.name, slug=payload.slug)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


@router.get("/slug/{slug}", response_model=InstanceOut)
def get_instance_by_slug(
    org_id: str,
    slug: str,
    _: Annotated[User, Depends(require_org_member)],
    db: Db,
):
    try:
        oid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    inst = db.query(Instance).filter_by(organization_id=oid, slug=slug).first()
    if not inst:
        raise HTTPException(404, "Instance not found")
    return inst


@router.get("/{instance_id}", response_model=InstanceOut)
def get_instance(
    org_id: str,
    instance_id: str,
    _: Annotated[User, Depends(require_org_member)],
    db: Db,
):
    return _get_instance_or_404(org_id, instance_id, db)


@router.patch("/{instance_id}", response_model=InstanceOut)
def update_instance(
    org_id: str,
    instance_id: str,
    payload: InstanceUpdate,
    _: Annotated[User, Depends(require_org_admin)],
    db: Db,
):
    inst = _get_instance_or_404(org_id, instance_id, db)
    if payload.name is not None:
        inst.name = payload.name
    if payload.is_active is not None:
        inst.is_active = payload.is_active
    db.commit()
    db.refresh(inst)
    return inst


@router.delete("/{instance_id}", status_code=204)
def delete_instance(
    org_id: str,
    instance_id: str,
    _: Annotated[User, Depends(require_org_admin)],
    db: Db,
):
    inst = _get_instance_or_404(org_id, instance_id, db)
    inst.is_active = False
    db.commit()


# ── Instance members ──────────────────────────────────────────────────────────

@router.get("/{instance_id}/members", response_model=list[MemberOut])
def list_instance_members(
    org_id: str,
    instance_id: str,
    _: Annotated[User, Depends(require_instance_admin)],
    db: Db,
):
    _get_instance_or_404(org_id, instance_id, db)
    try:
        iid = uuid.UUID(instance_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    memberships = db.query(InstanceMembership).filter_by(instance_id=iid).all()
    return [
        MemberOut(user_id=str(m.user_id), email=m.user.email, full_name=m.user.full_name, role=m.role)
        for m in memberships
    ]


@router.post("/{instance_id}/members", status_code=201)
def add_instance_member(
    org_id: str,
    instance_id: str,
    payload: InviteRequest,
    _: Annotated[User, Depends(require_instance_admin)],
    db: Db,
):
    _get_instance_or_404(org_id, instance_id, db)
    try:
        oid, iid = uuid.UUID(org_id), uuid.UUID(instance_id)
    except ValueError:
        raise HTTPException(404, "Not found")

    user = db.query(User).filter_by(email=payload.email).first()
    if not user:
        raise HTTPException(404, "User not found — invite them to the organization first")

    # Must be an org member
    org_m = db.query(OrganizationMembership).filter_by(user_id=user.id, organization_id=oid).first()
    if not org_m:
        raise HTTPException(400, "User must be an organization member before joining an instance")

    existing = db.query(InstanceMembership).filter_by(user_id=user.id, instance_id=iid).first()
    if existing:
        existing.role = payload.role
    else:
        db.add(InstanceMembership(user_id=user.id, instance_id=iid, role=payload.role))
    db.commit()
    return {"user_id": str(user.id)}


@router.patch("/{instance_id}/members/{user_id}")
def update_instance_member_role(
    org_id: str,
    instance_id: str,
    user_id: str,
    payload: InviteRequest,
    _: Annotated[User, Depends(require_instance_admin)],
    db: Db,
):
    try:
        iid, uid = uuid.UUID(instance_id), uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    m = db.query(InstanceMembership).filter_by(user_id=uid, instance_id=iid).first()
    if not m:
        raise HTTPException(404, "Member not found")
    m.role = payload.role
    db.commit()
    return {"role": m.role}


@router.delete("/{instance_id}/members/{user_id}", status_code=204)
def remove_instance_member(
    org_id: str,
    instance_id: str,
    user_id: str,
    _: Annotated[User, Depends(require_instance_admin)],
    db: Db,
):
    try:
        iid, uid = uuid.UUID(instance_id), uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    m = db.query(InstanceMembership).filter_by(user_id=uid, instance_id=iid).first()
    if m:
        db.delete(m)
        db.commit()
