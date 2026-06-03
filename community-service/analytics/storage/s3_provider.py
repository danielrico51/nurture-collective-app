import logging
from datetime import datetime

from django.conf import settings

from analytics.events import CommunityEvent
from analytics.s3_paths import event_s3_key
from analytics.s3_writer import event_to_dict, put_event_json

logger = logging.getLogger(__name__)


class S3StorageProvider:
    def write(self, event: CommunityEvent) -> str:
        bucket = settings.NURTURE_EVENTS_BUCKET
        if not bucket:
            raise ValueError("NURTURE_EVENTS_BUCKET is not configured")

        dt = datetime.fromisoformat(event.occurred_at.replace("Z", "+00:00"))
        key = event_s3_key(event.domain, event.event_type, event.event_id, dt)
        put_event_json(bucket, key, event_to_dict(event))
        location = f"s3://{bucket}/{key}"
        logger.debug("Wrote event to %s", location)
        return location
