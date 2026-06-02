import pytest

from messaging.models import PostReaction, ReactionType
from tests.factories import CommunityFactory


@pytest.mark.django_db
def test_set_and_toggle_reactions(organization, parent_user, auth_client):
    community = CommunityFactory(organization=organization)
    auth_client.post(f"/api/v1/communities/{community.id}/join/", {}, format="json")

    post = auth_client.post(
        f"/api/v1/communities/{community.id}/posts/",
        {"body": "React to me"},
        format="json",
    ).json()
    post_id = post["post_id"]
    base = f"/api/v1/communities/{community.id}/posts/{post_id}/reactions/"

    loved = auth_client.post(
        base, {"reaction_type": ReactionType.LOVE}, format="json"
    )
    assert loved.status_code == 200
    assert loved.json()["reactions"]["user_reaction"] == ReactionType.LOVE
    assert loved.json()["reactions"]["total"] == 1

    liked = auth_client.post(
        base, {"reaction_type": ReactionType.LIKE}, format="json"
    )
    assert liked.status_code == 200
    assert liked.json()["reactions"]["user_reaction"] == ReactionType.LIKE
    assert PostReaction.objects.filter(post_id=post_id).count() == 1

    toggled_off = auth_client.post(
        base, {"reaction_type": ReactionType.LIKE}, format="json"
    )
    assert toggled_off.status_code == 200
    assert toggled_off.json()["reactions"]["user_reaction"] is None
    assert toggled_off.json()["reactions"]["total"] == 0


@pytest.mark.django_db
def test_reactions_in_post_list(organization, parent_user, auth_client):
    community = CommunityFactory(organization=organization)
    auth_client.post(f"/api/v1/communities/{community.id}/join/", {}, format="json")

    post = auth_client.post(
        f"/api/v1/communities/{community.id}/posts/",
        {"body": "Hello"},
        format="json",
    ).json()
    auth_client.post(
        f"/api/v1/communities/{community.id}/posts/{post['post_id']}/reactions/",
        {"reaction_type": ReactionType.LIKE},
        format="json",
    )

    feed = auth_client.get(f"/api/v1/communities/{community.id}/posts/")
    assert feed.status_code == 200
    item = feed.json()["results"][0]
    assert item["reactions"]["total"] == 1
    assert item["reactions"]["counts"]["like"] == 1
