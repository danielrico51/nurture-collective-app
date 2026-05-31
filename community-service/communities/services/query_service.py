from uuid import UUID

from django.db.models import Q, QuerySet

from communities.models import Community, CommunityMembership, CommunityVisibility
from communities.repositories import CommunityRepository, MembershipRepository
from users.auth.base import AuthContext


class CommunityQueryService:
    """Read-only community queries."""

    def __init__(
        self,
        community_repo: CommunityRepository | None = None,
        membership_repo: MembershipRepository | None = None,
    ):
        self.community_repo = community_repo or CommunityRepository()
        self.membership_repo = membership_repo or MembershipRepository()

    def list_discoverable(
        self,
        auth: AuthContext,
        *,
        visibility: str | None = None,
        tag: str | None = None,
    ) -> QuerySet[Community]:
        qs = self.community_repo.list_for_organization(auth.organization_id)
        qs = self.community_repo.annotate_member_count(qs)

        member_community_ids = CommunityMembership.objects.filter(
            user_id=auth.user_id,
            left_at__isnull=True,
        ).values_list("community_id", flat=True)

        qs = qs.filter(
            Q(visibility=CommunityVisibility.PUBLIC)
            | Q(id__in=member_community_ids)
        )

        if visibility:
            qs = qs.filter(visibility=visibility)
        if tag:
            qs = qs.filter(tags__contains=[tag])

        return qs.order_by("-created_at")

    def get_detail(
        self, auth: AuthContext, community_id: UUID
    ) -> tuple[Community | None, CommunityMembership | None]:
        community = self.community_repo.get_by_id(
            community_id, organization_id=auth.organization_id
        )
        if community is None:
            return None, None

        membership = self.membership_repo.get_active(auth.user_id, community_id)

        if community.visibility != CommunityVisibility.PUBLIC and membership is None:
            if auth.platform_role != "admin":
                return None, None

        community = (
            self.community_repo.annotate_member_count(
                Community.objects.filter(id=community.id)
            ).first()
            or community
        )
        return community, membership

    def list_my_communities(
        self, auth: AuthContext
    ) -> QuerySet[CommunityMembership]:
        return (
            self.membership_repo.list_active_for_user(auth.user_id)
            .select_related("community")
            .order_by("-joined_at")
        )
