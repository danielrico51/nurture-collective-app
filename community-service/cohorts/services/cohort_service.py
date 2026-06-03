from __future__ import annotations

from uuid import UUID

from django.utils import timezone

from analytics.emitter import emit_event
from analytics.events import EVENT_COHORT_ASSIGNED, CommunityEvent
from cohorts.exceptions import (
    AlreadyInCohortError,
    CohortNotFoundError,
    PermissionDeniedError,
)
from cohorts.models import CohortMembershipSource
from cohorts.repositories import CohortMembershipRepository, CohortRepository
from cohorts.services.assignment import match_all_cohorts
from communities.exceptions import AlreadyMemberError
from communities.services.membership_service import MembershipService
from users.auth.base import AuthContext
from users.models import PlatformRole, UserProfile
from users.services.profile_service import get_profile


class CohortService:
    def __init__(
        self,
        cohort_repo: CohortRepository | None = None,
        membership_repo: CohortMembershipRepository | None = None,
    ):
        self.cohort_repo = cohort_repo or CohortRepository()
        self.membership_repo = membership_repo or CohortMembershipRepository()

    def list_cohorts(
        self,
        auth: AuthContext,
        *,
        cohort_type: str | None = None,
        is_active: bool = True,
    ):
        return self.cohort_repo.list_active(
            auth.organization_id,
            cohort_type=cohort_type,
            is_active=is_active,
        )

    def list_my_memberships(self, auth: AuthContext):
        return self.membership_repo.get_for_user(auth.user_id, auth.organization_id)

    def join(
        self,
        auth: AuthContext,
        cohort_id: UUID,
        *,
        source: str = CohortMembershipSource.MANUAL,
    ) -> dict:
        cohort = self.cohort_repo.get_by_id(cohort_id, auth.organization_id)
        if cohort is None:
            raise CohortNotFoundError("Cohort not found")
        if not cohort.is_active:
            raise CohortNotFoundError("Cohort is not active")

        if self.membership_repo.has_membership(auth.user_id, cohort_id):
            raise AlreadyInCohortError("Already in this cohort")

        return self._assign_cohort(auth, cohort, source=source)

    def assign_all(
        self,
        auth: AuthContext,
        *,
        target_user_id: UUID | None = None,
        force_refresh: bool = False,
    ) -> list[dict]:
        if target_user_id and target_user_id != auth.user_id:
            if auth.platform_role != PlatformRole.ADMIN:
                raise PermissionDeniedError("Only admin can assign for another user")
            profile = UserProfile.objects.get(
                id=target_user_id, organization_id=auth.organization_id
            )
            subject_auth = AuthContext(
                user_id=profile.id,
                cognito_sub=profile.cognito_sub,
                organization_id=profile.organization_id,
                platform_role=profile.platform_role,
                display_name=profile.display_name or "",
            )
        else:
            profile = get_profile(auth)
            subject_auth = auth

        cohorts = list(
            self.cohort_repo.list_active(subject_auth.organization_id, is_active=True)
        )
        matches = match_all_cohorts(cohorts, profile.profile_metadata or {})

        assigned: list[dict] = []
        for match in matches:
            cohort = match.cohort
            if self.membership_repo.has_membership(subject_auth.user_id, cohort.id):
                if not force_refresh:
                    continue
                continue
            assigned.append(
                self._assign_cohort(
                    subject_auth,
                    cohort,
                    source=CohortMembershipSource.AUTO,
                )
            )
        return assigned

    def _assign_cohort(self, auth: AuthContext, cohort, *, source: str) -> dict:
        now = timezone.now()
        self.membership_repo.create(
            organization_id=auth.organization_id,
            user_id=auth.user_id,
            cohort_id=cohort.id,
            source=source,
            assigned_at=now,
        )

        linked_id = cohort.linked_community_id
        if linked_id:
            try:
                MembershipService().join(auth, linked_id)
            except AlreadyMemberError:
                pass

        emit_event(
            CommunityEvent(
                event_type=EVENT_COHORT_ASSIGNED,
                domain="cohorts",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "cohort_id": str(cohort.id),
                    "cohort_type": cohort.cohort_type,
                    "source": source,
                    "linked_community_id": str(linked_id) if linked_id else None,
                },
            )
        )

        return {
            "cohort_id": str(cohort.id),
            "cohort_type": cohort.cohort_type,
            "name": cohort.name,
            "source": source,
            "linked_community_id": str(linked_id) if linked_id else None,
        }


def serialize_cohort(cohort) -> dict:
    return {
        "cohort_id": str(cohort.id),
        "cohort_type": cohort.cohort_type,
        "name": cohort.name,
        "description": cohort.description,
        "window_start": (
            cohort.window_start.isoformat() if cohort.window_start else None
        ),
        "window_end": cohort.window_end.isoformat() if cohort.window_end else None,
        "linked_community_id": (
            str(cohort.linked_community_id) if cohort.linked_community_id else None
        ),
        "is_active": cohort.is_active,
    }


def serialize_membership(membership) -> dict:
    cohort = membership.cohort
    return {
        "membership_id": str(membership.id),
        "cohort_id": str(cohort.id),
        "cohort_type": cohort.cohort_type,
        "name": cohort.name,
        "source": membership.source,
        "assigned_at": membership.assigned_at,
        "linked_community_id": (
            str(cohort.linked_community_id) if cohort.linked_community_id else None
        ),
    }
