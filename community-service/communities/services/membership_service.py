from uuid import UUID

from django.utils import timezone

from analytics.emitter import emit_event
from analytics.events import (
    EVENT_COMMUNITY_JOINED,
    EVENT_COMMUNITY_LEFT,
    EVENT_MEMBERSHIP_ROLE_CHANGED,
    CommunityEvent,
)
from communities.exceptions import (
    AlreadyMemberError,
    CommunityNotFoundError,
    NotMemberError,
    PermissionDeniedError,
)
from communities.models import CommunityRole, CommunityVisibility
from communities.repositories import CommunityRepository, MembershipRepository
from users.auth.base import AuthContext
from users.models import PlatformRole


class MembershipService:
    """Write operations for memberships."""

    def __init__(
        self,
        community_repo: CommunityRepository | None = None,
        membership_repo: MembershipRepository | None = None,
    ):
        self.community_repo = community_repo or CommunityRepository()
        self.membership_repo = membership_repo or MembershipRepository()

    def join(self, auth: AuthContext, community_id: UUID):
        community = self.community_repo.get_by_id(
            community_id, organization_id=auth.organization_id
        )
        if community is None:
            raise CommunityNotFoundError("Community not found")

        if community.visibility != CommunityVisibility.PUBLIC:
            raise PermissionDeniedError("Community is not open for public join")

        existing = self.membership_repo.get_active(auth.user_id, community_id)
        if existing is not None:
            raise AlreadyMemberError("Already an active member")

        membership = self.membership_repo.create(
            organization_id=auth.organization_id,
            user_id=auth.user_id,
            community_id=community_id,
            role=CommunityRole.MEMBER,
            joined_at=timezone.now(),
        )

        emit_event(
            CommunityEvent(
                event_type=EVENT_COMMUNITY_JOINED,
                domain="community",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "community_id": str(community_id),
                    "membership_id": str(membership.id),
                    "role": membership.role,
                },
            )
        )
        return membership

    def leave(self, auth: AuthContext, community_id: UUID):
        membership = self.membership_repo.get_active(auth.user_id, community_id)
        if membership is None:
            raise NotMemberError("Not an active member")

        membership.left_at = timezone.now()
        self.membership_repo.save(membership)

        emit_event(
            CommunityEvent(
                event_type=EVENT_COMMUNITY_LEFT,
                domain="community",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "community_id": str(community_id),
                    "membership_id": str(membership.id),
                },
            )
        )
        return membership

    def change_role(
        self,
        auth: AuthContext,
        community_id: UUID,
        user_id: UUID,
        new_role: str,
    ):
        if auth.platform_role != PlatformRole.ADMIN:
            raise PermissionDeniedError("Only admin can change membership roles")

        membership = self.membership_repo.get_active(user_id, community_id)
        if membership is None:
            raise NotMemberError("User is not an active member")

        old_role = membership.role
        membership.role = new_role
        self.membership_repo.save(membership)

        emit_event(
            CommunityEvent(
                event_type=EVENT_MEMBERSHIP_ROLE_CHANGED,
                domain="community",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "community_id": str(community_id),
                    "membership_id": str(membership.id),
                    "target_user_id": str(user_id),
                    "old_role": old_role,
                    "new_role": new_role,
                },
            )
        )
        return membership
