import pytest

from tests.factories import CommunityFactory


@pytest.mark.django_db
def test_create_post_and_list_feed(organization, parent_user, auth_client):
    community = CommunityFactory(organization=organization)
    auth_client.post(f"/api/v1/communities/{community.id}/join/", {}, format="json")

    created = auth_client.post(
        f"/api/v1/communities/{community.id}/posts/",
        {"title": "Welcome", "body": "Glad to be here!"},
        format="json",
    )
    assert created.status_code == 201
    assert created.json()["title"] == "Welcome"
    assert created.json()["body"] == "Glad to be here!"

    feed = auth_client.get(f"/api/v1/communities/{community.id}/posts/")
    assert feed.status_code == 200
    results = feed.json()["results"]
    assert len(results) == 1
    assert results[0]["comment_count"] == 0


@pytest.mark.django_db
def test_comments_thread_one_level(organization, parent_user, auth_client):
    community = CommunityFactory(organization=organization)
    auth_client.post(f"/api/v1/communities/{community.id}/join/", {}, format="json")

    post = auth_client.post(
        f"/api/v1/communities/{community.id}/posts/",
        {"body": "Any tips for night feeds?"},
        format="json",
    ).json()
    post_id = post["post_id"]

    top = auth_client.post(
        f"/api/v1/communities/{community.id}/posts/{post_id}/comments/",
        {"body": "Cluster feeds before bed."},
        format="json",
    )
    assert top.status_code == 201
    top_id = top.json()["comment_id"]

    reply = auth_client.post(
        f"/api/v1/communities/{community.id}/posts/{post_id}/comments/",
        {"body": "This helped us too!", "parent_id": top_id},
        format="json",
    )
    assert reply.status_code == 201

    nested = auth_client.post(
        f"/api/v1/communities/{community.id}/posts/{post_id}/comments/",
        {"body": "Too deep", "parent_id": reply.json()["comment_id"]},
        format="json",
    )
    assert nested.status_code == 400

    tree = auth_client.get(
        f"/api/v1/communities/{community.id}/posts/{post_id}/comments/"
    )
    assert tree.status_code == 200
    comments = tree.json()["comments"]
    assert len(comments) == 1
    assert len(comments[0]["replies"]) == 1


@pytest.mark.django_db
def test_posts_require_membership(organization, parent_user, auth_client):
    community = CommunityFactory(organization=organization)
    denied = auth_client.get(f"/api/v1/communities/{community.id}/posts/")
    assert denied.status_code == 403
