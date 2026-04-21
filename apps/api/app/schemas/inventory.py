import uuid
from datetime import datetime
from pydantic import BaseModel, model_validator


def _rating_to_level(rating: float) -> str:
    if 0 <= rating < 1:
        return "Low"
    if 1 <= rating < 2:
        return "Moderate"
    if 2 <= rating < 3:
        return "High"
    if 3 <= rating <= 4:
        return "Very High"
    return ""


# ── Threat ────────────────────────────────────────────────────────────────────

class ThreatCreate(BaseModel):
    threat_id: str | None = None
    category: str | None = None
    name: str
    description: str | None = None
    aggregate_rating: float | None = None
    aggregate_level: str | None = None
    source: str | None = None

    @model_validator(mode="after")
    def compute_level(self):
        if self.aggregate_rating is not None:
            self.aggregate_rating = round(self.aggregate_rating, 2)
            self.aggregate_level = _rating_to_level(self.aggregate_rating)
        return self


class ThreatUpdate(BaseModel):
    threat_id: str | None = None
    category: str | None = None
    name: str | None = None
    description: str | None = None
    aggregate_rating: float | None = None
    aggregate_level: str | None = None
    source: str | None = None

    @model_validator(mode="after")
    def compute_level(self):
        if self.aggregate_rating is not None:
            self.aggregate_rating = round(self.aggregate_rating, 2)
            self.aggregate_level = _rating_to_level(self.aggregate_rating)
        return self


class ThreatOut(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    threat_id: str | None
    category: str | None
    name: str
    description: str | None
    aggregate_rating: float | None
    aggregate_level: str | None
    source: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Software ──────────────────────────────────────────────────────────────────

class SoftwareCreate(BaseModel):
    software_id: str | None = None
    name: str
    status: str | None = None
    business_unit: str | None = None
    recovery_point_objective: str | None = None
    recovery_time_objective: str | None = None
    criticality: str | None = None
    description: str | None = None
    application_owner: str | None = None
    data_classification: str | None = None
    compliance: str | None = None
    vendor_name: str | None = None
    version: str | None = None


class SoftwareUpdate(SoftwareCreate):
    name: str | None = None


class SoftwareOut(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    software_id: str | None
    name: str
    status: str | None
    business_unit: str | None
    recovery_point_objective: str | None
    recovery_time_objective: str | None
    criticality: str | None
    description: str | None
    application_owner: str | None
    data_classification: str | None
    compliance: str | None
    vendor_name: str | None
    version: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Hardware ──────────────────────────────────────────────────────────────────

class HardwareCreate(BaseModel):
    hardware_id: str | None = None
    vendor: str | None = None
    model: str | None = None
    description: str | None = None
    status: str | None = None


class HardwareUpdate(HardwareCreate):
    pass


class HardwareOut(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    hardware_id: str | None
    vendor: str | None
    model: str | None
    description: str | None
    status: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
