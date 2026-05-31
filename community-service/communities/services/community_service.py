from analytics.emitter import emit_event
from analytics.events import EVENT_COMMUNITY_CREATED, CommunityEvent
from communities.exceptions import PermissionDeniedError
from communities.repositories import CommunityRepository, MembershipRepository
from users.auth.base import AuthContext
from users.models import PlatformRole, UserProfile


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
        if auth.platform_role not in (PlatformRole.ADMIN, PlatformRole.PROVIDER):
            raise PermissionDeniedError("Only admin or provider can create communities")

        creator = UserProfile.objects.filter(id=auth.user_id).first()
        community = self.community_repo.create(
            organization_id=auth.organization_id,
            name=name.strip(),
            description=description.strip(),
            visibility=visibility,
            tags=tags or [],
            created_by=creator,
        )

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
