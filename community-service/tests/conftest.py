import pytest
from rest_framework.test import APIClient

from tests.factories import OrganizationFactory, UserProfileFactory, auth_header


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def organization(db):
    from users.models import Organization

    org, _ = Organization.objects.get_or_create(
        slug="nurture-collective",
        defaults={"name": "Nurture Collective LLC"},
    )
    return org


@pytest.fixture
def parent_user(organization):
    return UserProfileFactory(
        organization=organization,
        platform_role="parent",
        cognito_sub="parent-sub",
    )


@pytest.fixture
def admin_user(organization):
    return UserProfileFactory(
        organization=organization,
        platform_role="admin",
        cognito_sub="admin-sub",
    )


@pytest.fixture
def provider_user(organization):
    return UserProfileFactory(
        organization=organization,
        platform_role="provider",
        cognito_sub="provider-sub",
    )


@pytest.fixture
def auth_client(api_client, parent_user):
    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer dev:parent:{parent_user.id}",
    )
    return api_client
