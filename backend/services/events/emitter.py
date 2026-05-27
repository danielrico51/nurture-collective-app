from typing import Any

from django.conf import settings

from services.s3.client import put_json
from services.s3.paths import event_key, utc_now_iso
from services.schemas.event import EventActor, PlatformEvent


def emit_event(
    event_type: str,
    entity_type: str,
    entity_id: str,
    payload: dict[str, Any] | None = None,
    actor: EventActor | None = None,
) -> PlatformEvent:
    event = PlatformEvent(
        event_type=event_type,
        entity_type=entity_type,  # type: ignore[arg-type]
        entity_id=entity_id,
        timestamp=utc_now_iso(),
        actor=actor or EventActor(),
        payload=payload or {},
    )

    bucket = settings.S3_BUCKETS.get("events", "")
    if bucket:
        key = event_key(event_type)
        put_json(bucket, key, event.model_dump())

    # Also append under lead/client partition when applicable
    if entity_type == "lead" and settings.S3_BUCKETS.get("leads"):
        from services.s3.writer import append_lead_artifact

        append_lead_artifact(entity_id, "events", "event.json", event.model_dump())

    return event
