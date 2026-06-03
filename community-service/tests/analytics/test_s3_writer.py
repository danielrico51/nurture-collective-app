from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from analytics.events import CommunityEvent
from analytics.s3_writer import event_to_dict, put_event_json


def test_event_to_dict_shape():
    event = CommunityEvent(
        event_type="post_created",
        domain="messaging",
        organization_id="org-1",
        user_id="user-1",
        properties={"post_id": "p1"},
    )
    payload = event_to_dict(event)
    assert payload["event_type"] == "post_created"
    assert payload["properties"]["post_id"] == "p1"


@patch("analytics.s3_writer.boto3.client")
def test_put_event_json_retries_then_succeeds(mock_client_factory):
    client = MagicMock()
    mock_client_factory.return_value = client
    error = ClientError(
        {"Error": {"Code": "SlowDown", "Message": "slow"}},
        "PutObject",
    )
    client.put_object.side_effect = [error, None]

    put_event_json("events-bucket", "messaging/event_type=post_created/year=2026/month=06/day=02/hour=12/id.json", {"ok": True})

    assert client.put_object.call_count == 2


@patch("analytics.s3_writer.boto3.client")
def test_put_event_json_raises_after_max_attempts(mock_client_factory):
    client = MagicMock()
    mock_client_factory.return_value = client
    error = ClientError(
        {"Error": {"Code": "AccessDenied", "Message": "denied"}},
        "PutObject",
    )
    client.put_object.side_effect = error

    with pytest.raises(ClientError):
        put_event_json("events-bucket", "key.json", {"ok": True})

    assert client.put_object.call_count == 3
