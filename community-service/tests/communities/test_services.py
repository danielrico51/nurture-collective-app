from unittest.mock import patch
from uuid import uuid4

import pytest

from communities.exceptions import AlreadyMemberError, PermissionDeniedError
from communities.models import CommunityVisibility
from communities.services.community_service import CommunityService
from communities.services.membership_service import MembershipService
from tests.factories import CommunityFactory, UserProfileFactory
from users.auth.base import AuthContext


def _auth(user, organization):
    return AuthContext(
        user_id=user.id,
        cognito_sub=user.cognito_sub,
        organization_id=organization.id,
        platform_role=user.platform_role,
        display_name=user.display_name,
    )


@pytest.mark.django_db
@patch("communities.services.community_service.emit_event")
def test_create_community_emits_event(mock_emit, organization, admin_user):
    auth = _auth(admin_user, organization)
    community = CommunityService().create(
        auth,
        name="Test",
        description="Desc",
        visibility=CommunityVisibility.PUBLIC,
        tags=["postpartum"],
    )
    assert community.organization_id == organization.id
    mock_emit.assert_called_once()


@pytest.mark.django_db
def test_parent_cannot_create_community(organization, parent_user):
    auth = _auth(parent_user, organization)
    with pytest.raises(PermissionDeniedError):
        CommunityService().create(
            auth,
            name="Test",
            description="",
            visibility=CommunityVisibility.PUBLIC,
            tags=[],
        )


@pytest.mark.django_db
@patch("communities.services.membership_service.emit_event")
def test_join_public_community(mock_emit, organization, parent_user):
    community = CommunityFactory(organization=organization)
    auth = _auth(parent_user, organization)
    membership = MembershipService().join(auth, community.id)
    assert membership.community_id == community.id
    mock_emit.assert_called_once()


@pytest.mark.django_db
def test_join_private_community_denied(organization, parent_user):
    community = CommunityFactory(
        organization=organization, visibility=CommunityVisibility.PRIVATE
    )
    auth = _auth(parent_user, organization)
    with pytest.raises(PermissionDeniedError):
        MembershipService().join(auth, community.id)


@pytest.mark.django_db
def test_join_twice_raises_conflict(organization, parent_user):
    community = CommunityFactory(organization=organization)
    auth = _auth(parent_user, organization)
    MembershipService().join(auth, community.id)
    with pytest.raises(AlreadyMemberError):
        MembershipService().join(auth, community.id)
