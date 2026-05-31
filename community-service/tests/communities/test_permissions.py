from unittest.mock import patch
from uuid import uuid4

import pytest

from communities.exceptions import NotMemberError, PermissionDeniedError
from communities.models import CommunityVisibility
from communities.services.membership_service import MembershipService
from communities.services.query_service import CommunityQueryService
from tests.factories import CommunityFactory, MembershipFactory, UserProfileFactory
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
def test_private_community_hidden_from_non_member(organization, parent_user):
    community = CommunityFactory(
        organization=organization, visibility=CommunityVisibility.PRIVATE
    )
    auth = _auth(parent_user, organization)
    result, membership = CommunityQueryService().get_detail(auth, community.id)
    assert result is None
    assert membership is None


@pytest.mark.django_db
def test_private_community_visible_to_member(organization, parent_user):
    community = CommunityFactory(
        organization=organization, visibility=CommunityVisibility.PRIVATE
    )
    MembershipFactory(
        community=community, user=parent_user, organization=organization
    )
    auth = _auth(parent_user, organization)
    result, membership = CommunityQueryService().get_detail(auth, community.id)
    assert result is not None
    assert membership is not None


@pytest.mark.django_db
def test_admin_can_view_private_community(organization, admin_user):
    community = CommunityFactory(
        organization=organization, visibility=CommunityVisibility.PRIVATE
    )
    auth = _auth(admin_user, organization)
    result, _membership = CommunityQueryService().get_detail(auth, community.id)
    assert result is not None


@pytest.mark.django_db
@patch("communities.services.membership_service.emit_event")
def test_change_role_emits_event(mock_emit, organization, admin_user, parent_user):
    community = CommunityFactory(organization=organization)
    MembershipFactory(
        community=community, user=parent_user, organization=organization
    )
    auth = _auth(admin_user, organization)

    MembershipService().change_role(
        auth, community.id, parent_user.id, "moderator"
    )
    mock_emit.assert_called_once()
    assert mock_emit.call_args[0][0].event_type == "membership_role_changed"


@pytest.mark.django_db
def test_parent_cannot_change_role(organization, parent_user):
    community = CommunityFactory(organization=organization)
    target = UserProfileFactory(organization=organization)
    MembershipFactory(community=community, user=target, organization=organization)
    auth = _auth(parent_user, organization)

    with pytest.raises(PermissionDeniedError):
        MembershipService().change_role(
            auth, community.id, target.id, "moderator"
        )


@pytest.mark.django_db
def test_change_role_for_non_member_raises(organization, admin_user):
    community = CommunityFactory(organization=organization)
    auth = _auth(admin_user, organization)

    with pytest.raises(NotMemberError):
        MembershipService().change_role(auth, community.id, uuid4(), "moderator")
