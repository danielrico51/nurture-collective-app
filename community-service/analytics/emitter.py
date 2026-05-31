import logging

from django.conf import settings

from analytics.events import CommunityEvent
from analytics.storage.local_provider import LocalStorageProvider
from analytics.storage.s3_provider import S3StorageProvider

logger = logging.getLogger(__name__)


def get_storage_provider():
    if settings.EVENTS_USE_LOCAL or not settings.NURTURE_EVENTS_BUCKET:
        return LocalStorageProvider()
    return S3StorageProvider()


def emit_event(event: CommunityEvent) -> str:
    """
    Async-friendly event emission. Non-blocking: failures are logged, not raised.
    TODO: Celery task wrapper with retry (Sprint 4).
    """
    try:
        provider = get_storage_provider()
        location = provider.write(event)
        logger.debug("emit_event %s -> %s", event.event_type, location)
        return event.event_id
    except Exception:
        logger.exception("emit_event failed for %s", event.event_type)
        return event.event_id
