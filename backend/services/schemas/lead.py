from typing import Any, Literal

from pydantic import BaseModel, Field


LeadStatus = Literal[
    "new",
    "intake_in_progress",
    "intake_completed",
    "consult_scheduled",
    "consult_completed",
    "proposal_sent",
    "contract_pending",
    "converted",
    "lost",
    "stale",
]


class LeadProfile(BaseModel):
    lead_id: str
    status: LeadStatus = "new"
    email: str = ""
    phone: str = ""
    name: str = ""
    cognito_user_id: str = ""
    coordinator_id: str = ""
    maternal_stage: str | None = None
    source: str = "intake_chat"
    metadata: dict[str, Any] = Field(default_factory=dict)


class IntakeArtifact(BaseModel):
    lead_id: str
    profile: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[dict[str, Any]] = Field(default_factory=list)
    intake_status: str = "draft"
