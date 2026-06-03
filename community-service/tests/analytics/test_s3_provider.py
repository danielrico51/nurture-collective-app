from unittest.mock import patch

from analytics.events import CommunityEvent
from analytics.storage.s3_provider import S3StorageProvider


@patch("analytics.storage.s3_provider.put_event_json")
def test_s3_provider_writes_partitioned_key(mock_put, settings):
    settings.NURTURE_EVENTS_BUCKET = "nurture-events-test"
    event = CommunityEvent(
        event_type="post_created",
        domain="messaging",
        organization_id="org-1",
        user_id="user-1",
        occurred_at="2026-06-02T15:00:00Z",
    )
    location = S3StorageProvider().write(event)
    assert location.startswith("s3://nurture-events-test/messaging/")
    mock_put.assert_called_once()
    key = mock_put.call_args[0][1]
    assert "event_type=post_created" in key
