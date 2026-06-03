"""Domain exceptions for cohorts."""


class CohortError(Exception):
    code = "COHORT_ERROR"


class CohortNotFoundError(CohortError):
    code = "NOT_FOUND"


class AlreadyInCohortError(CohortError):
    code = "ALREADY_IN_COHORT"


class PermissionDeniedError(CohortError):
    code = "PERMISSION_DENIED"
