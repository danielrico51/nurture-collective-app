from datetime import date
from uuid import UUID

from cohorts.models import Cohort, CohortMembership, CohortType


class CohortRepository:
    def list_active(
        self,
        organization_id: UUID,
        *,
        cohort_type: str | None = None,
        is_active: bool = True,
    ):
        qs = Cohort.objects.filter(organization_id=organization_id, is_active=is_active)
        if cohort_type:
            qs = qs.filter(cohort_type=cohort_type)
        return qs.select_related("linked_community").order_by("cohort_type", "name")

    def get_by_id(self, cohort_id: UUID, organization_id: UUID) -> Cohort | None:
        return (
            Cohort.objects.filter(id=cohort_id, organization_id=organization_id)
            .select_related("linked_community")
            .first()
        )


class CohortMembershipRepository:
    def get_for_user(self, user_id: UUID, organization_id: UUID):
        return (
            CohortMembership.objects.filter(
                user_id=user_id,
                organization_id=organization_id,
            )
            .select_related("cohort", "cohort__linked_community")
            .order_by("-assigned_at")
        )

    def has_membership(self, user_id: UUID, cohort_id: UUID) -> bool:
        return CohortMembership.objects.filter(
            user_id=user_id, cohort_id=cohort_id
        ).exists()

    def create(
        self,
        *,
        organization_id: UUID,
        user_id: UUID,
        cohort_id: UUID,
        source: str,
        assigned_at,
        expires_at=None,
    ) -> CohortMembership:
        return CohortMembership.objects.create(
            organization_id=organization_id,
            user_id=user_id,
            cohort_id=cohort_id,
            source=source,
            assigned_at=assigned_at,
            expires_at=expires_at,
        )
