from uuid import UUID

from django.db.models import Count, Q, QuerySet

from communities.models import Community, CommunityMembership, CommunityVisibility
from users.models import UserProfile


class CommunityRepository:
    def create(self, **kwargs) -> Community:
        return Community.objects.create(**kwargs)

    def get_by_id(
        self, community_id: UUID, organization_id: UUID | None = None
    ) -> Community | None:
        qs = Community.objects.filter(id=community_id)
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        return qs.first()

    def list_for_organization(self, organization_id: UUID) -> QuerySet[Community]:
        return Community.objects.filter(organization_id=organization_id)

    def annotate_member_count(self, qs: QuerySet[Community]) -> QuerySet[Community]:
        return qs.annotate(
            member_count=Count(
                "memberships",
                filter=Q(
                    memberships__left_at__isnull=True,
                    memberships__deleted_at__isnull=True,
                ),
            )
        )


class MembershipRepository:
    def create(self, **kwargs) -> CommunityMembership:
        return CommunityMembership.objects.create(**kwargs)

    def get_active(
        self, user_id: UUID, community_id: UUID
    ) -> CommunityMembership | None:
        return CommunityMembership.objects.filter(
            user_id=user_id,
            community_id=community_id,
            left_at__isnull=True,
        ).first()

    def list_active_for_user(self, user_id: UUID) -> QuerySet[CommunityMembership]:
        return CommunityMembership.objects.filter(
            user_id=user_id,
            left_at__isnull=True,
        ).select_related("community")

    def list_active_for_community(
        self, community_id: UUID
    ) -> QuerySet[CommunityMembership]:
        return CommunityMembership.objects.filter(
            community_id=community_id,
            left_at__isnull=True,
        )

    def save(self, membership: CommunityMembership) -> CommunityMembership:
        membership.save()
        return membership
