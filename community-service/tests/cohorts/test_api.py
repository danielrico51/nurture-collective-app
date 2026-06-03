from datetime import date
from unittest.mock import patch

import pytest

from cohorts.models import CohortType
from infrastructure import feature_flags
from tests.factories import CohortFactory, CommunityFactory, auth_header


@pytest.fixture(autouse=True)
def enable_cohorts_flag():
    previous = feature_flags.FLAGS["ENABLE_COHORTS"]
    feature_flags.FLAGS["ENABLE_COHORTS"] = True
    yield
    feature_flags.FLAGS["ENABLE_COHORTS"] = previous


@pytest.mark.django_db
def test_cohorts_disabled_returns_503(api_client, parent_user):
    feature_flags.FLAGS["ENABLE_COHORTS"] = False
    response = api_client.get(
        "/api/v1/cohorts/",
        **auth_header(parent_user),
    )
    assert response.status_code == 503


@pytest.mark.django_db
def test_list_cohorts(api_client, organization, parent_user):
    CohortFactory(organization=organization, name="Due Jun 2026")
    response = api_client.get(
        "/api/v1/cohorts/",
        **auth_header(parent_user),
    )
    assert response.status_code == 200
    assert len(response.json()["results"]) >= 1


@pytest.mark.django_db
@patch("cohorts.services.cohort_service.emit_event")
def test_assign_and_join_linked_community(mock_emit, api_client, organization, parent_user):
    community = CommunityFactory(organization=organization, visibility="public")
    cohort = CohortFactory(
        organization=organization,
        cohort_type=CohortType.PREGNANCY,
        linked_community=community,
        window_start=date(2026, 8, 1),
        window_end=date(2026, 8, 31),
    )
    parent_user.profile_metadata = {"due_date": "2026-08-20"}
    parent_user.save(update_fields=["profile_metadata"])

    assign = api_client.post(
        "/api/v1/cohorts/assign/",
        {},
        format="json",
        **auth_header(parent_user),
    )
    assert assign.status_code == 200
    assigned = assign.json()["assigned"]
    assert len(assigned) == 1
    assert assigned[0]["cohort_id"] == str(cohort.id)
    mock_emit.assert_called()

    mine = api_client.get(
        "/api/v1/cohorts/me/",
        **auth_header(parent_user),
    )
    assert mine.status_code == 200
    assert len(mine.json()["results"]) == 1

    communities = api_client.get(
        "/api/v1/communities/me/",
        **auth_header(parent_user),
    )
    assert communities.status_code == 200
    assert len(communities.json()["results"]) == 1


@pytest.mark.django_db
def test_manual_join_idempotent(api_client, organization, parent_user):
    cohort = CohortFactory(organization=organization)
    first = api_client.post(
        f"/api/v1/cohorts/{cohort.id}/join/",
        {},
        format="json",
        **auth_header(parent_user),
    )
    assert first.status_code == 201

    second = api_client.post(
        f"/api/v1/cohorts/{cohort.id}/join/",
        {},
        format="json",
        **auth_header(parent_user),
    )
    assert second.status_code == 409


@pytest.mark.django_db
def test_recommendations_exclude_existing(api_client, organization, parent_user):
    cohort = CohortFactory(
        organization=organization,
        cohort_type=CohortType.PREGNANCY,
        window_start=date(2026, 9, 1),
        window_end=date(2026, 9, 30),
    )
    parent_user.profile_metadata = {"due_date": "2026-09-15"}
    parent_user.save(update_fields=["profile_metadata"])

    api_client.post(
        f"/api/v1/cohorts/{cohort.id}/join/",
        {},
        format="json",
        **auth_header(parent_user),
    )

    recs = api_client.get(
        "/api/v1/cohorts/recommendations/",
        **auth_header(parent_user),
    )
    assert recs.status_code == 200
    ids = [r["cohort_id"] for r in recs.json()["recommendations"]]
    assert str(cohort.id) not in ids
