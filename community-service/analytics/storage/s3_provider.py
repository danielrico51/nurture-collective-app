import logging
from datetime import datetime

from analytics.events import CommunityEvent
from analytics.s3_paths import event_s3_key

logger = logging.getLogger(__name__)


class S3StorageProvider:
    """Full S3 upload — implement retry in Sprint 4."""

    def write(self, event: CommunityEvent) -> str:
        logger.info(
            "S3StorageProvider stub — event_type=%s event_id=%s",
            event.event_type,
            event.event_id,
        )
        dt = datetime.fromisoformat(event.occurred_at.replace("Z", "+00:00"))
        return event_s3_key(event.domain, event.event_type, event.event_id, dt)
