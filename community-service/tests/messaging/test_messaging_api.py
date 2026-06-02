import pytest
from rest_framework.test import APIClient

from communities.models import Community
from messaging.models import Channel, Message
from messaging.services.channel_service import ChannelService
from tests.factories import CommunityFactory, UserProfileFactory


@pytest.mark.django_db
def test_join_creates_default_channel_and_member(organization, parent_user, auth_client):
    community = CommunityFactory(organization=organization)
    join = auth_client.post(f"/api/v1/communities/{community.id}/join/", {}, format="json")
    assert join.status_code == 201

    channel = Channel.objects.filter(community_id=community.id).first()
    assert channel is not None
    assert channel.name == "General"

    channels = auth_client.get(
        f"/api/v1/channels/?community_id={community.id}"
    )
    assert channels.status_code == 200
    assert len(channels.json()["results"]) >= 1


@pytest.mark.django_db
def test_send_and_list_messages(organization, parent_user, auth_client):
    community = CommunityFactory(organization=organization)
    auth_client.post(f"/api/v1/communities/{community.id}/join/", {}, format="json")

    channels = auth_client.get(
        f"/api/v1/channels/?community_id={community.id}"
    ).json()["results"]
    channel_id = channels[0]["channel_id"]

    sent = auth_client.post(
        f"/api/v1/channels/{channel_id}/messages/",
        {"message": "Hello moms!"},
        format="json",
    )
    assert sent.status_code == 201
    assert sent.json()["message"] == "Hello moms!"

    history = auth_client.get(f"/api/v1/channels/{channel_id}/messages/")
    assert history.status_code == 200
    assert len(history.json()["messages"]) == 1


@pytest.mark.django_db
def test_direct_channel_deduplication(organization, parent_user):
    other = UserProfileFactory(organization=organization, platform_role="parent")
    from users.auth.base import AuthContext

    auth = AuthContext(
        user_id=parent_user.id,
        cognito_sub=parent_user.cognito_sub,
        organization_id=organization.id,
        platform_role="parent",
        display_name="Parent",
    )
    svc = ChannelService()
    first = svc.create_direct(auth, participant_id=other.id)
    second = svc.create_direct(auth, participant_id=other.id)
    assert first.id == second.id
