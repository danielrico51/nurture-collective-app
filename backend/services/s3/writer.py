from typing import Any

from django.conf import settings

from services.s3.client import put_json
from services.s3.paths import utc_now_iso


def bucket_for(domain: str) -> str:
    name = settings.S3_BUCKETS.get(domain, "")
    if not name:
        raise ValueError(f"S3 bucket for domain '{domain}' is not configured")
    return name


def append_lead_artifact(
    lead_id: str,
    category: str,
    filename: str,
    payload: dict[str, Any],
) -> str:
    from services.s3.paths import lead_artifact_key

    key = lead_artifact_key(lead_id, category, filename)
    enriched = {
        **payload,
        "lead_id": lead_id,
        "written_at": utc_now_iso(),
    }
    put_json(bucket_for("leads"), key, enriched)
    return key


def append_client_artifact(
    client_id: str,
    category: str,
    filename: str,
    payload: dict[str, Any],
) -> str:
    from services.s3.paths import client_prefix, file_datetime_partition

    key = f"{client_prefix(client_id)}{category.strip('/')}/{file_datetime_partition()}/{filename}"
    enriched = {
        **payload,
        "client_id": client_id,
        "written_at": utc_now_iso(),
    }
    put_json(bucket_for("clients"), key, enriched)
    return key
