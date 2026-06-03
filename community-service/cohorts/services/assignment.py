"""Hard-coded cohort assignment — no JSON rule engine."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from cohorts.models import Cohort, CohortType


@dataclass(frozen=True)
class CohortMatch:
    cohort: Cohort
    reason: str
    score: float = 1.0


def _parse_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, str):
        text = value.strip()[:10]
        try:
            return date.fromisoformat(text)
        except ValueError:
            return None
    return None


def _get_int(metadata: dict[str, Any], key: str) -> int | None:
    raw = metadata.get(key)
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def _infer_postpartum_weeks(metadata: dict[str, Any]) -> int | None:
    weeks = _get_int(metadata, "postpartum_weeks")
    if weeks is not None:
        return max(0, weeks)
    months = _get_int(metadata, "postpartum_months")
    if months is not None:
        return max(0, months * 4)
    stage = metadata.get("maternal_stage")
    if stage == "newly-postpartum":
        return 2
    return None


def _infer_newborn_age_days(metadata: dict[str, Any]) -> int | None:
    days = _get_int(metadata, "newborn_age_days")
    if days is not None:
        return max(0, days)
    stage = metadata.get("maternal_stage")
    if stage in ("newly-postpartum", "infant-care"):
        return 14
    return None


def _week_in_cohort(cohort: Cohort, weeks: int) -> bool:
    meta = cohort.metadata or {}
    week_min = _get_int(meta, "week_min")
    week_max = _get_int(meta, "week_max")
    if week_min is None or week_max is None:
        return False
    return week_min <= weeks <= week_max


def _days_in_cohort(cohort: Cohort, days: int) -> bool:
    meta = cohort.metadata or {}
    day_min = _get_int(meta, "day_min")
    day_max = _get_int(meta, "day_max")
    if day_min is None or day_max is None:
        return False
    return day_min <= days <= day_max


def _pregnancy_window_days(cohort: Cohort) -> int | None:
    if not cohort.window_start or not cohort.window_end:
        return None
    return (cohort.window_end - cohort.window_start).days


def _effective_due_date(metadata: dict[str, Any]) -> date | None:
    for key in ("due_date", "estimated_due_date", "expected_due_date"):
        parsed = _parse_date(metadata.get(key))
        if parsed is not None:
            return parsed
    return None


def match_journey_stage_cohorts(
    cohorts: list[Cohort], profile_metadata: dict[str, Any]
) -> list[CohortMatch]:
    stage = profile_metadata.get("maternal_stage")
    if not stage or not isinstance(stage, str):
        return []

    journey_path = profile_metadata.get("journey_path")
    matches: list[CohortMatch] = []
    for cohort in cohorts:
        if not cohort.is_active:
            continue
        meta = cohort.metadata or {}
        stages = meta.get("match_stages") or []
        if stage not in stages:
            continue
        allowed_paths = meta.get("match_journey_paths") or []
        if allowed_paths and journey_path not in allowed_paths:
            continue
        reason = f"stage {stage}"
        if journey_path:
            reason = f"{reason}, path {journey_path}"
        matches.append(
            CohortMatch(
                cohort=cohort,
                reason=f"matches {reason}",
            )
        )
    return matches[:1]


def match_pregnancy_cohorts(
    cohorts: list[Cohort], profile_metadata: dict[str, Any]
) -> list[CohortMatch]:
    due = _effective_due_date(profile_metadata)
    if due is None:
        return []

    matches: list[CohortMatch] = []
    for cohort in cohorts:
        if cohort.cohort_type != CohortType.PREGNANCY or not cohort.is_active:
            continue
        if not cohort.window_start or not cohort.window_end:
            continue
        if cohort.window_start <= due <= cohort.window_end:
            matches.append(
                CohortMatch(
                    cohort=cohort,
                    reason=f"due_date {due.isoformat()} within {cohort.window_start}–{cohort.window_end}",
                )
            )

    matches.sort(
        key=lambda m: (
            _pregnancy_window_days(m.cohort)
            if _pregnancy_window_days(m.cohort) is not None
            else 99999,
            m.cohort.created_at,
        )
    )
    if matches:
        return [matches[0]]
    return []


def match_postpartum_cohorts(
    cohorts: list[Cohort], profile_metadata: dict[str, Any]
) -> list[CohortMatch]:
    weeks = _infer_postpartum_weeks(profile_metadata)
    if weeks is None:
        return []

    matches: list[CohortMatch] = []
    for cohort in cohorts:
        if cohort.cohort_type != CohortType.POSTPARTUM or not cohort.is_active:
            continue
        if _week_in_cohort(cohort, weeks):
            matches.append(
                CohortMatch(
                    cohort=cohort,
                    reason=f"postpartum_weeks {weeks} within cohort window",
                )
            )
    return matches[:1]


def match_newborn_cohorts(
    cohorts: list[Cohort], profile_metadata: dict[str, Any]
) -> list[CohortMatch]:
    days = _infer_newborn_age_days(profile_metadata)
    if days is None:
        return []

    matches: list[CohortMatch] = []
    for cohort in cohorts:
        if cohort.cohort_type != CohortType.NEWBORN or not cohort.is_active:
            continue
        if _days_in_cohort(cohort, days):
            matches.append(
                CohortMatch(
                    cohort=cohort,
                    reason=f"newborn_age_days {days} within cohort window",
                )
            )
    return matches[:1]


def match_all_cohorts(
    cohorts: list[Cohort], profile_metadata: dict[str, Any]
) -> list[CohortMatch]:
    seen: set[str] = set()
    ordered: list[CohortMatch] = []
    for matcher in (
        match_journey_stage_cohorts,
        match_pregnancy_cohorts,
        match_postpartum_cohorts,
        match_newborn_cohorts,
    ):
        for match in matcher(cohorts, profile_metadata):
            cid = str(match.cohort.id)
            if cid in seen:
                continue
            seen.add(cid)
            ordered.append(match)
    return ordered
