from celery import shared_task

from services.s3.writer import append_lead_artifact
from services.integrations.slack import notify_channel
from django.conf import settings


@shared_task(name="ai.generate_coordinator_brief")
def generate_coordinator_brief(lead_id: str) -> str:
    """Generate AI prep brief after consult.booked — Sprint 2 full OpenAI implementation."""
    summary = {
        "lead_id": lead_id,
        "brief": "Coordinator brief placeholder — wire OpenAI in Sprint 2.",
        "source": "ai.generate_coordinator_brief",
    }
    key = append_lead_artifact(lead_id, "ai/summaries", "summary.json", summary)
    if settings.SLACK_BOT_TOKEN:
        notify_channel(
            settings.SLACK_CHANNEL_SCHEDULED_CALLS,
            f"Prep brief ready for lead `{lead_id}` — {key}",
        )
    return key


@shared_task(name="ai.generate_proposal_draft")
def generate_proposal_draft(lead_id: str, params: dict) -> str:
    proposal = {
        "lead_id": lead_id,
        "version": 1,
        "status": "draft",
        "content": "Proposal draft placeholder — wire OpenAI in Sprint 3.",
        "params": params,
    }
    return append_lead_artifact(lead_id, "proposals", "proposal_v1.json", proposal)


@shared_task(name="ai.generate_contract_draft")
def generate_contract_draft(lead_id: str, params: dict) -> str:
    from services.s3.client import put_json
    from services.s3.paths import file_datetime_partition, utc_now_iso
    from django.conf import settings

    bucket = settings.S3_BUCKETS.get("contracts", "")
    key = f"drafts/lead_id={lead_id}/{file_datetime_partition()}/draft.json"
    draft = {
        "lead_id": lead_id,
        "status": "pending_review",
        "created_at": utc_now_iso(),
        "content": "Contract draft placeholder — wire OpenAI + templates in Sprint 4.",
        "params": params,
    }
    if bucket:
        put_json(bucket, key, draft)
    return key
