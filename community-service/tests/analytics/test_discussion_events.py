from unittest.mock import patch

import pytest

from analytics.events import (
    EVENT_COMMENT_CREATED,
    EVENT_POST_CREATED,
    EVENT_REACTION_ADDED,
    EVENT_REACTION_REMOVED,
)
from communities.services.membership_service import MembershipService
from messaging.services.discussion_service import DiscussionService
from tests.factories import CommunityFactory
from users.auth.base import AuthContext


def _auth(user, organization) -> AuthContext:
    return AuthContext(
        user_id=user.id,
        cognito_sub=user.cognito_sub,
        organization_id=organization.id,
        platform_role=user.platform_role,
        display_name=user.display_name,
    )


@pytest.mark.django_db
@patch("messaging.services.discussion_service.emit_messaging_discussion_event")
def test_create_post_emits_event(mock_emit, organization, parent_user):
    community = CommunityFactory(organization=organization)
    auth = _auth(parent_user, organization)
    MembershipService().join(auth, community.id)
    DiscussionService().create_post(
        auth,
        community.id,
        env_scope="dev",
        title="Hi",
        body="First post",
    )
    mock_emit.assert_called_once()
    assert mock_emit.call_args[0][0] == EVENT_POST_CREATED


@pytest.mark.django_db
@patch("messaging.services.discussion_service.emit_messaging_discussion_event")
def test_create_comment_emits_event(mock_emit, organization, parent_user):
    community = CommunityFactory(organization=organization)
    auth = _auth(parent_user, organization)
    MembershipService().join(auth, community.id)
    service = DiscussionService()
    post = service.create_post(
        auth, community.id, env_scope="dev", body="Question?"
    )
    mock_emit.reset_mock()
    service.create_comment(
        auth, community.id, post.id, env_scope="dev", body="Answer"
    )
    mock_emit.assert_called_once()
    assert mock_emit.call_args[0][0] == EVENT_COMMENT_CREATED


@pytest.mark.django_db
@patch("messaging.services.discussion_service.emit_messaging_discussion_event")
def test_toggle_reaction_emits_add_and_remove(mock_emit, organization, parent_user):
    community = CommunityFactory(organization=organization)
    auth = _auth(parent_user, organization)
    MembershipService().join(auth, community.id)
    service = DiscussionService()
    post = service.create_post(
        auth, community.id, env_scope="dev", body="Celebrate"
    )
    mock_emit.reset_mock()
    service.set_post_reaction(
        auth, community.id, post.id, env_scope="dev", reaction_type="love"
    )
    assert mock_emit.call_args[0][0] == EVENT_REACTION_ADDED

    service.set_post_reaction(
        auth, community.id, post.id, env_scope="dev", reaction_type="love"
    )
    assert mock_emit.call_args[0][0] == EVENT_REACTION_REMOVED
