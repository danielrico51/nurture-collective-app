"""S3 partition path builder — implement Sprint 4."""

from datetime import datetime


def event_s3_key(domain: str, event_type: str, event_id: str, dt: datetime) -> str:
    return (
        f"{domain}/event_type={event_type}/"
        f"year={dt.year}/month={dt.month:02d}/day={dt.day:02d}/hour={dt.hour:02d}/"
        f"{event_id}.json"
    )
