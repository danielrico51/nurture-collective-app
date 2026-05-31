from analytics.storage.local_provider import LocalStorageProvider
from analytics.events import CommunityEvent


def test_local_storage_partition_path(tmp_path):
    event = CommunityEvent(
        event_type="community_created",
        domain="community",
        organization_id="org-id",
        user_id="user-id",
        occurred_at="2026-05-31T14:00:00Z",
    )
    provider = LocalStorageProvider(root=tmp_path)
    path = provider.write(event)
    assert "community/event_type=community_created" in path
    assert path.endswith(".json")
