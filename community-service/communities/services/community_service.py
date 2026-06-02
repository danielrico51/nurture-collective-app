from django.utils import timezone

from analytics.emitter import emit_event
from analytics.events import EVENT_COMMUNITY_CREATED, CommunityEvent
from communities.models import CommunityRole
from communities.repositories import CommunityRepository, MembershipRepository
from users.auth.base import AuthContext
from users.models import UserProfile


class CommunityService:
    """Write operations for communities."""

    def __init__(
        self,
        community_repo: CommunityRepository | None = None,
        membership_repo: MembershipRepository | None = None,
    ):
        self.community_repo = community_repo or CommunityRepository()
        self.membership_repo = membership_repo or MembershipRepository()

    def create(
        self,
        auth: AuthContext,
        *,
        name: str,
        description: str,
        visibility: str,
        tags: list[str],
    ):
        creator = UserProfile.objects.filter(id=auth.user_id).first()
        community = self.community_repo.create(
            organization_id=auth.organization_id,
            name=name.strip(),
            description=description.strip(),
            visibility=visibility,
            tags=tags or [],
            created_by=creator,
        )

        from messaging.services.channel_service import ChannelService

        channel_svc = ChannelService()
        channel_svc.create_default_channel_for_community(
            organization_id=auth.organization_id,
            community_id=community.id,
        )

        # The creator owns and is the first member of their community.
        self.membership_repo.create(
            organization_id=auth.organization_id,
            user_id=auth.user_id,
            community_id=community.id,
            role=CommunityRole.OWNER,
            joined_at=timezone.now(),
        )
        channel_svc.ensure_community_channel_membership(auth.user_id, community.id)

        emit_event(
            CommunityEvent(
                event_type=EVENT_COMMUNITY_CREATED,
                domain="community",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "community_id": str(community.id),
                    "visibility": visibility,
                    "tags": tags or [],
                },
            )
        )
        return community
