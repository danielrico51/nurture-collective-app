from datetime import datetime, timezone
import re


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def file_datetime_partition(dt: datetime | None = None) -> str:
    """file_datetime=YYYY-MM-DDTHH-MM-SSZ"""
    value = dt or datetime.now(timezone.utc)
    stamp = value.strftime("%Y-%m-%dT%H-%M-%SZ")
    return f"file_datetime={stamp}"


def sanitize_segment(value: str) -> str:
    trimmed = value.strip().lower()
    if not trimmed:
        return "unknown"
    return re.sub(r"[^a-z0-9._@-]+", "_", trimmed)[:128]


def lead_prefix(lead_id: str) -> str:
    return f"leads/lead_id={sanitize_segment(lead_id)}/"


def lead_artifact_key(lead_id: str, category: str, filename: str, dt: datetime | None = None) -> str:
    """e.g. leads/lead_id=x/intake/file_datetime=.../intake.json"""
    return f"{lead_prefix(lead_id)}{category.strip('/')}/{file_datetime_partition(dt)}/{filename}"


def client_prefix(client_id: str) -> str:
    return f"clients/client_id={sanitize_segment(client_id)}/"


def event_key(event_type: str, dt: datetime | None = None) -> str:
    value = dt or datetime.now(timezone.utc)
    return (
        f"year={value.year}/month={value.month:02d}/day={value.day:02d}/"
        f"event_type={sanitize_segment(event_type)}/{file_datetime_partition(value)}/event.json"
    )
