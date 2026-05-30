import logging
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from pydantic import ValidationError

from config.intake import IntakeSettings, load_intake_settings
from services.leads.repository import LeadRepository
from services.schemas.intake import EnrichedIntakeLead, IntakeSubmitRequest, IntakeSubmitResponse
from services.schemas.lead import LeadProfile
from services.s3.client import put_json
from services.s3.paths import dead_letter_intake_key, historical_intake_key, utc_now_iso

logger = logging.getLogger("intake_service")


class IntakeValidationError(ValueError):
    pass


class IntakePipelineError(RuntimeError):
    pass


class RateLimitError(RuntimeError):
    pass


_rate_limit_buckets: dict[str, tuple[int, float]] = {}


def _digits_only(value: str) -> str:
    return re.sub(r"\D", "", value)


def normalize_phone(phone: str) -> str:
    if not phone.strip():
        return ""
    digits = _digits_only(phone)
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    if phone.strip().startswith("+"):
        return f"+{digits}"
    return f"+{digits}" if digits else ""


def validate_payload(raw: dict[str, Any]) -> IntakeSubmitRequest:
    try:
        return IntakeSubmitRequest.model_validate(raw)
    except ValidationError as exc:
        raise IntakeValidationError(str(exc)) from exc


def normalize_payload(payload: IntakeSubmitRequest) -> IntakeSubmitRequest:
    return IntakeSubmitRequest(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=normalize_phone(payload.phone),
        email=payload.email.strip().lower(),
        service_requested=payload.service_requested.strip(),
        message=payload.message.strip(),
        source=payload.source.strip() or "website",
    )


def enrich_payload(payload: IntakeSubmitRequest) -> EnrichedIntakeLead:
    now = utc_now_iso()
    return EnrichedIntakeLead(
        lead_id=str(uuid.uuid4()),
        created_at=now,
        updated_at=now,
        status="new",
        version=1,
        lead_source=payload.source or "website",
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        email=payload.email,
        service_requested=payload.service_requested,
        message=payload.message,
    )


def log_submission(event: str, **details: Any) -> None:
    logger.info(
        "intake_submit event=%s at=%s %s",
        event,
        utc_now_iso(),
        " ".join(f"{key}={value}" for key, value in details.items()),
    )


def check_rate_limit(client_key: str, settings: IntakeSettings | None = None) -> None:
    cfg = settings or load_intake_settings()
    now = time.time()
    count, reset_at = _rate_limit_buckets.get(client_key, (0, now + cfg.rate_limit_window))
    if reset_at <= now:
        count = 0
        reset_at = now + cfg.rate_limit_window
    count += 1
    _rate_limit_buckets[client_key] = (count, reset_at)
    if count > cfg.rate_limit_max:
        raise RateLimitError("Too many submissions. Please wait and try again.")


def _store_historical(lead: EnrichedIntakeLead, settings: IntakeSettings) -> str:
    if not settings.leads_bucket:
        raise IntakePipelineError("LEADS_BUCKET is not configured")
    key = historical_intake_key(lead.lead_id, datetime.now(timezone.utc))
    put_json(settings.leads_bucket, key, lead.model_dump())
    return key


def _store_dead_letter(lead: EnrichedIntakeLead, reason: str, error: Exception, settings: IntakeSettings) -> None:
    if not settings.leads_bucket:
        return
    payload = {
        **lead.model_dump(),
        "dead_letter_reason": reason,
        "dead_letter_error": str(error),
        "dead_letter_at": utc_now_iso(),
    }
    key = dead_letter_intake_key(lead.lead_id, reason, datetime.now(timezone.utc))
    try:
        put_json(settings.leads_bucket, key, payload)
    except Exception as exc:
        logger.exception("dead letter write failed lead_id=%s reason=%s error=%s", lead.lead_id, reason, exc)


def _store_crm_snapshot(lead: EnrichedIntakeLead) -> None:
    repo = LeadRepository()
    if not repo.bucket:
        return
    name = " ".join(part for part in [lead.first_name, lead.last_name] if part).strip()
    profile = LeadProfile(
        lead_id=lead.lead_id,
        status="new",
        email=lead.email,
        phone=lead.phone,
        name=name,
        source=lead.lead_source,
        metadata={
            "service_requested": lead.service_requested,
            "message": lead.message,
            "created_at": lead.created_at,
        },
    )
    repo.save_lead_profile(profile)


def send_to_n8n(lead: EnrichedIntakeLead, settings: IntakeSettings | None = None) -> bool:
    cfg = settings or load_intake_settings()
    if not cfg.n8n_webhook_url:
        log_submission("n8n_skipped", lead_id=lead.lead_id, reason="not_configured")
        return False

    headers = {"Content-Type": "application/json"}
    if cfg.n8n_webhook_secret:
        headers["Authorization"] = f"Bearer {cfg.n8n_webhook_secret}"

    with httpx.Client(timeout=cfg.intake_timeout) as client:
        response = client.post(cfg.n8n_webhook_url, json=lead.model_dump(), headers=headers)
        if response.status_code >= 400:
            raise IntakePipelineError(f"n8n webhook failed with status {response.status_code}")
    return True


def retry_failures(label: str, fn, settings: IntakeSettings | None = None):
    cfg = settings or load_intake_settings()
    last_error: Exception | None = None
    for attempt in range(1, cfg.max_retries + 2):
        try:
            return fn()
        except Exception as exc:
            last_error = exc
            log_submission("retry", label=label, attempt=attempt, error=str(exc))
            if attempt > cfg.max_retries:
                break
            time.sleep(min(attempt, 4))
    raise IntakePipelineError(f"{label} failed after retries") from last_error


def log_submission_record(lead: EnrichedIntakeLead, settings: IntakeSettings | None = None) -> str:
    cfg = settings or load_intake_settings()
    return retry_failures("historical_storage", lambda: _store_historical(lead, cfg), cfg)


def submit_intake(raw_payload: dict[str, Any], client_key: str = "anonymous") -> IntakeSubmitResponse:
    settings = load_intake_settings()
    check_rate_limit(client_key, settings)

    validated = validate_payload(raw_payload)
    normalized = normalize_payload(validated)
    lead = enrich_payload(normalized)

    log_submission(
        "received",
        lead_id=lead.lead_id,
        lead_source=lead.lead_source,
        service_requested=lead.service_requested,
    )

    try:
        retry_failures("historical_storage", lambda: _store_historical(lead, settings), settings)
    except Exception as exc:
        _store_dead_letter(lead, "historical_storage", exc, settings)
        raise IntakePipelineError("Could not store intake submission") from exc

    _store_crm_snapshot(lead)

    forwarded = False
    try:
        forwarded = retry_failures("n8n_forward", lambda: send_to_n8n(lead, settings), settings)
    except Exception as exc:
        _store_dead_letter(lead, "n8n_forward", exc, settings)
        raise IntakePipelineError(
            "Lead saved, but automation handoff failed. Our team has been notified."
        ) from exc

    log_submission("completed", lead_id=lead.lead_id, forwarded=forwarded)
    return IntakeSubmitResponse(lead_id=lead.lead_id, forwarded=forwarded, stored=True)


def intake_health(settings: IntakeSettings | None = None) -> dict[str, str]:
    cfg = settings or load_intake_settings()
    n8n = "not_configured"
    if cfg.n8n_webhook_url:
        n8n = "configured"
        try:
            with httpx.Client(timeout=3) as client:
                response = client.head(cfg.n8n_webhook_url)
                if response.status_code < 500:
                    n8n = "connected"
        except Exception:
            n8n = "configured"

    storage = "local" if not cfg.leads_bucket else "ready"
    status = "healthy" if storage != "not_configured" else "degraded"
    return {"status": status, "n8n": n8n, "storage": storage}
