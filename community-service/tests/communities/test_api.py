from unittest.mock import patch

import pytest

from communities.models import CommunityVisibility
from tests.factories import CommunityFactory, auth_header


@pytest.mark.django_db
def test_health_ok(api_client):
    response = api_client.get("/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.django_db
@patch("communities.services.community_service.emit_event")
def test_create_community_as_admin(mock_emit, api_client, organization, admin_user):
    response = api_client.post(
        "/api/v1/communities/",
        {
            "name": "Postpartum Circle",
            "description": "Support group",
            "visibility": "public",
            "tags": ["postpartum"],
        },
        format="json",
        **auth_header(admin_user, "admin"),
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Postpartum Circle"
    mock_emit.assert_called_once()


@pytest.mark.django_db
def test_create_community_as_parent_forbidden(api_client, organization, parent_user):
    response = api_client.post(
        "/api/v1/communities/",
        {"name": "Test", "visibility": "public"},
        format="json",
        **auth_header(parent_user, "parent"),
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_list_and_join_community(api_client, organization, parent_user, admin_user):
    create = api_client.post(
        "/api/v1/communities/",
        {"name": "Public Group", "visibility": "public", "tags": []},
        format="json",
        **auth_header(admin_user, "admin"),
    )
    community_id = create.json()["community_id"]

    listing = api_client.get(
        "/api/v1/communities/",
        **auth_header(parent_user, "parent"),
    )
    assert listing.status_code == 200
    assert listing.json()["count"] >= 1

    join = api_client.post(
        f"/api/v1/communities/{community_id}/join/",
        {},
        format="json",
        **auth_header(parent_user, "parent"),
    )
    assert join.status_code == 201

    mine = api_client.get(
        "/api/v1/communities/me/",
        **auth_header(parent_user, "parent"),
    )
    assert mine.status_code == 200
    assert len(mine.json()["results"]) == 1


@pytest.mark.django_db
def test_leave_community(api_client, organization, parent_user, admin_user):
    create = api_client.post(
        "/api/v1/communities/",
        {"name": "Leave Test", "visibility": "public"},
        format="json",
        **auth_header(admin_user, "admin"),
    )
    community_id = create.json()["community_id"]
    api_client.post(
        f"/api/v1/communities/{community_id}/join/",
        {},
        format="json",
        **auth_header(parent_user, "parent"),
    )
    leave = api_client.post(
        f"/api/v1/communities/{community_id}/leave/",
        {},
        format="json",
        **auth_header(parent_user, "parent"),
    )
    assert leave.status_code == 200
    assert leave.json()["left_at"] is not None
