from datetime import date

import pytest

from cohorts.models import CohortType
from cohorts.services.assignment import (
    match_all_cohorts,
    match_journey_stage_cohorts,
    match_pregnancy_cohorts,
)
from tests.factories import CohortFactory, OrganizationFactory


@pytest.mark.django_db
def test_pregnancy_match_by_due_date():
    org = OrganizationFactory()
    cohort = CohortFactory(
        organization=org,
        cohort_type=CohortType.PREGNANCY,
        window_start=date(2026, 6, 1),
        window_end=date(2026, 6, 30),
    )
    matches = match_pregnancy_cohorts(
        [cohort], {"due_date": "2026-06-15"}
    )
    assert len(matches) == 1
    assert matches[0].cohort.id == cohort.id


@pytest.mark.django_db
def test_pregnancy_match_estimated_due_date():
    org = OrganizationFactory()
    cohort = CohortFactory(
        organization=org,
        cohort_type=CohortType.PREGNANCY,
        window_start=date(2026, 7, 1),
        window_end=date(2026, 7, 31),
    )
    matches = match_pregnancy_cohorts(
        [cohort], {"estimated_due_date": "2026-07-20"}
    )
    assert len(matches) == 1


@pytest.mark.django_db
def test_pregnancy_no_match_without_due_date():
    org = OrganizationFactory()
    cohort = CohortFactory(
        organization=org,
        cohort_type=CohortType.PREGNANCY,
        window_start=date(2026, 6, 1),
        window_end=date(2026, 6, 30),
    )
    assert match_pregnancy_cohorts([cohort], {}) == []


@pytest.mark.django_db
def test_journey_stage_ivf_match():
    org = OrganizationFactory()
    cohort = CohortFactory(
        organization=org,
        cohort_type=CohortType.PREGNANCY,
        metadata={
            "match_stages": ["trying-to-conceive"],
            "match_journey_paths": ["ivf"],
        },
    )
    matches = match_journey_stage_cohorts(
        [cohort],
        {"maternal_stage": "trying-to-conceive", "journey_path": "ivf"},
    )
    assert len(matches) == 1


@pytest.mark.django_db
def test_journey_stage_ttc_not_ivf_cohort():
    org = OrganizationFactory()
    cohort = CohortFactory(
        organization=org,
        name="IVF only",
        metadata={
            "match_stages": ["trying-to-conceive"],
            "match_journey_paths": ["ivf"],
        },
    )
    matches = match_journey_stage_cohorts(
        [cohort],
        {"maternal_stage": "trying-to-conceive", "journey_path": "ttc"},
    )
    assert len(matches) == 0


@pytest.mark.django_db
def test_postpartum_match_by_weeks():
    org = OrganizationFactory()
    cohort = CohortFactory(
        organization=org,
        cohort_type=CohortType.POSTPARTUM,
        metadata={"week_min": 0, "week_max": 12},
    )
    matches = match_all_cohorts([cohort], {"postpartum_weeks": 6})
    assert len(matches) == 1


@pytest.mark.django_db
def test_match_all_idempotent_types():
    org = OrganizationFactory()
    pregnancy = CohortFactory(
        organization=org,
        cohort_type=CohortType.PREGNANCY,
        window_start=date(2026, 7, 1),
        window_end=date(2026, 7, 31),
    )
    postpartum = CohortFactory(
        organization=org,
        cohort_type=CohortType.POSTPARTUM,
        metadata={"week_min": 0, "week_max": 12},
    )
    matches = match_all_cohorts(
        [pregnancy, postpartum],
        {"due_date": "2026-07-10", "postpartum_weeks": 4},
    )
    assert len(matches) == 2
