from unittest.mock import patch
from uuid import uuid4

import pytest

from analytics.emitter import emit_event
from analytics.events import CommunityEvent, EVENT_COMMUNITY_JOINED
from tests.factories import CommunityFactory, UserProfileFactory


@pytest.mark.django_db
@patch("analytics.emitter.get_storage_provider")
def test_emit_event_writes_local(mock_provider, tmp_path, settings):
    settings.EVENTS_USE_LOCAL = True

    class CapturingProvider:
        def write(self, event):
            from analytics.storage.local_provider import LocalStorageProvider

            provider = LocalStorageProvider(root=tmp_path)
            return provider.write(event)

    mock_provider.return_value = CapturingProvider()

    event_id = emit_event(
        CommunityEvent(
            event_type=EVENT_COMMUNITY_JOINED,
            domain="community",
            organization_id=str(uuid4()),
            user_id=str(uuid4()),
            properties={"community_id": str(uuid4())},
        )
    )
    assert event_id
    assert list(tmp_path.rglob("*.json"))
