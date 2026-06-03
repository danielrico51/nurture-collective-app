from uuid import UUID

from cohorts.repositories import CohortMembershipRepository, CohortRepository
from cohorts.services.assignment import CohortMatch, match_all_cohorts
from users.models import UserProfile


class RecommendationService:
    def __init__(
        self,
        cohort_repo: CohortRepository | None = None,
        membership_repo: CohortMembershipRepository | None = None,
    ):
        self.cohort_repo = cohort_repo or CohortRepository()
        self.membership_repo = membership_repo or CohortMembershipRepository()

    def recommend(self, user: UserProfile) -> list[dict]:
        cohorts = list(
            self.cohort_repo.list_active(user.organization_id, is_active=True)
        )
        member_cohort_ids = {
            str(m.cohort_id)
            for m in self.membership_repo.get_for_user(user.id, user.organization_id)
        }
        matches = match_all_cohorts(cohorts, user.profile_metadata or {})
        results: list[dict] = []
        for match in matches:
            if str(match.cohort.id) in member_cohort_ids:
                continue
            results.append(_serialize_recommendation(match))
        return results


def _serialize_recommendation(match: CohortMatch) -> dict:
    cohort = match.cohort
    return {
        "cohort_id": str(cohort.id),
        "cohort_type": cohort.cohort_type,
        "name": cohort.name,
        "description": cohort.description,
        "linked_community_id": (
            str(cohort.linked_community_id) if cohort.linked_community_id else None
        ),
        "score": match.score,
        "reason": match.reason,
    }
