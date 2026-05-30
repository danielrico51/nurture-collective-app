import os
from dataclasses import dataclass


@dataclass(frozen=True)
class IntakeSettings:
    n8n_webhook_url: str
    n8n_webhook_secret: str
    aws_region: str
    leads_bucket: str
    intake_timeout: int
    max_retries: int
    rate_limit_window: int
    rate_limit_max: int


def load_intake_settings() -> IntakeSettings:
    return IntakeSettings(
        n8n_webhook_url=os.environ.get("N8N_WEBHOOK_URL", "").strip(),
        n8n_webhook_secret=os.environ.get("N8N_WEBHOOK_SECRET", "").strip(),
        aws_region=os.environ.get("AWS_REGION", "us-east-1").strip(),
        leads_bucket=os.environ.get("LEADS_BUCKET", os.environ.get("NURTURE_LEADS_BUCKET", "")).strip(),
        intake_timeout=max(1, int(os.environ.get("INTAKE_TIMEOUT", "15"))),
        max_retries=max(0, int(os.environ.get("MAX_RETRIES", "3"))),
        rate_limit_window=max(1, int(os.environ.get("INTAKE_RATE_LIMIT_WINDOW", "60"))),
        rate_limit_max=max(1, int(os.environ.get("INTAKE_RATE_LIMIT_MAX", "10"))),
    )
