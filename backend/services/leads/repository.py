from typing import Any

from django.conf import settings

from services.s3.client import get_json, list_prefix
from services.s3.paths import lead_prefix
from services.s3.writer import append_lead_artifact
from services.schemas.lead import IntakeArtifact, LeadProfile


class LeadRepository:
    def __init__(self) -> None:
        self.bucket = settings.S3_BUCKETS.get("leads", "")

    def save_lead_profile(self, lead: LeadProfile) -> str:
        return append_lead_artifact(
            lead.lead_id,
            "profile",
            "lead_profile.json",
            lead.model_dump(),
        )

    def save_intake(self, artifact: IntakeArtifact) -> str:
        return append_lead_artifact(
            artifact.lead_id,
            "intake",
            "intake.json",
            artifact.model_dump(),
        )

    def get_lead_projection(self, lead_id: str) -> LeadProfile | None:
        if not self.bucket:
            return None
        prefix = f"{lead_prefix(lead_id)}profile/"
        keys = sorted(list_prefix(self.bucket, prefix), reverse=True)
        for key in keys:
            if key.endswith("lead_profile.json"):
                raw = get_json(self.bucket, key)
                if raw:
                    return LeadProfile.model_validate(raw)
        return None

    def get_latest_intake(self, lead_id: str) -> dict[str, Any] | None:
        if not self.bucket:
            return None
        prefix = f"{lead_prefix(lead_id)}intake/"
        keys = sorted(list_prefix(self.bucket, prefix), reverse=True)
        for key in keys:
            if key.endswith("intake.json"):
                return get_json(self.bucket, key)
        return None
