import json
import logging
import time
from typing import Any

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

from analytics.events import CommunityEvent

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3


def event_to_dict(event: CommunityEvent) -> dict[str, Any]:
    return {
        "event_id": event.event_id,
        "event_type": event.event_type,
        "domain": event.domain,
        "organization_id": event.organization_id,
        "user_id": event.user_id,
        "occurred_at": event.occurred_at,
        "properties": event.properties,
        "schema_version": event.schema_version,
    }


def put_event_json(bucket: str, key: str, payload: dict[str, Any]) -> None:
    region = getattr(settings, "AWS_REGION", "us-east-1")
    client = boto3.client("s3", region_name=region)
    body = json.dumps(payload, indent=2).encode("utf-8")
    last_error: ClientError | None = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            client.put_object(
                Bucket=bucket,
                Key=key,
                Body=body,
                ContentType="application/json",
            )
            return
        except ClientError as exc:
            last_error = exc
            logger.warning(
                "S3 PutObject attempt %s/%s failed for s3://%s/%s: %s",
                attempt,
                MAX_ATTEMPTS,
                bucket,
                key,
                exc,
            )
            if attempt < MAX_ATTEMPTS:
                time.sleep(0.2 * (2 ** (attempt - 1)))

    if last_error:
        raise last_error
