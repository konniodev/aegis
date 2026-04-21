import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser, require_org_member
from app.database import get_db
from app.models.inventory import Hardware, Software, Threat
from app.models.user import User
from app.schemas.inventory import (
    HardwareCreate, HardwareOut, HardwareUpdate,
    SoftwareCreate, SoftwareOut, SoftwareUpdate,
    ThreatCreate, ThreatOut, ThreatUpdate,
)

router = APIRouter(tags=["inventory"])
Db = Annotated[Session, Depends(get_db)]
OrgMember = Annotated[User, Depends(require_org_member)]


def _parse_org(org_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(404, "Organization not found")


# ── Threats ───────────────────────────────────────────────────────────────────

@router.get("/organizations/{org_id}/inventory/threats", response_model=list[ThreatOut])
def list_threats(org_id: str, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    return db.query(Threat).filter_by(organization_id=oid).order_by(Threat.created_at.desc()).all()


@router.post("/organizations/{org_id}/inventory/threats", response_model=ThreatOut, status_code=201)
def create_threat(org_id: str, payload: ThreatCreate, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    item = Threat(organization_id=oid, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/organizations/{org_id}/inventory/threats/{item_id}", response_model=ThreatOut)
def update_threat(org_id: str, item_id: str, payload: ThreatUpdate, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    item = db.query(Threat).filter_by(id=iid, organization_id=oid).first()
    if not item:
        raise HTTPException(404, "Threat not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/organizations/{org_id}/inventory/threats/{item_id}", status_code=204)
def delete_threat(org_id: str, item_id: str, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    item = db.query(Threat).filter_by(id=iid, organization_id=oid).first()
    if item:
        db.delete(item)
        db.commit()


# ── Software ──────────────────────────────────────────────────────────────────

@router.get("/organizations/{org_id}/inventory/software", response_model=list[SoftwareOut])
def list_software(org_id: str, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    return db.query(Software).filter_by(organization_id=oid).order_by(Software.created_at.desc()).all()


@router.post("/organizations/{org_id}/inventory/software", response_model=SoftwareOut, status_code=201)
def create_software(org_id: str, payload: SoftwareCreate, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    item = Software(organization_id=oid, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/organizations/{org_id}/inventory/software/{item_id}", response_model=SoftwareOut)
def update_software(org_id: str, item_id: str, payload: SoftwareUpdate, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    item = db.query(Software).filter_by(id=iid, organization_id=oid).first()
    if not item:
        raise HTTPException(404, "Software not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/organizations/{org_id}/inventory/software/{item_id}", status_code=204)
def delete_software(org_id: str, item_id: str, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    item = db.query(Software).filter_by(id=iid, organization_id=oid).first()
    if item:
        db.delete(item)
        db.commit()


# ── Hardware ──────────────────────────────────────────────────────────────────

@router.get("/organizations/{org_id}/inventory/hardware", response_model=list[HardwareOut])
def list_hardware(org_id: str, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    return db.query(Hardware).filter_by(organization_id=oid).order_by(Hardware.created_at.desc()).all()


@router.post("/organizations/{org_id}/inventory/hardware", response_model=HardwareOut, status_code=201)
def create_hardware(org_id: str, payload: HardwareCreate, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    item = Hardware(organization_id=oid, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/organizations/{org_id}/inventory/hardware/{item_id}", response_model=HardwareOut)
def update_hardware(org_id: str, item_id: str, payload: HardwareUpdate, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    item = db.query(Hardware).filter_by(id=iid, organization_id=oid).first()
    if not item:
        raise HTTPException(404, "Hardware not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/organizations/{org_id}/inventory/hardware/{item_id}", status_code=204)
def delete_hardware(org_id: str, item_id: str, _: OrgMember, db: Db):
    oid = _parse_org(org_id)
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(404, "Not found")
    item = db.query(Hardware).filter_by(id=iid, organization_id=oid).first()
    if item:
        db.delete(item)
        db.commit()
