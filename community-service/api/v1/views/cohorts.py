from uuid import UUID

from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from cohorts.exceptions import (
    AlreadyInCohortError,
    CohortError,
    CohortNotFoundError,
    PermissionDeniedError,
)
from cohorts.services.cohort_service import (
    CohortService,
    serialize_cohort,
    serialize_membership,
)
from cohorts.services.recommendations import RecommendationService
from infrastructure.feature_flags import require_feature
from users.middleware import get_request_auth
from users.services.profile_service import get_profile


def _error_response(exc: CohortError, status: int) -> Response:
    return Response(
        {"error": str(exc), "code": exc.code, "details": {}},
        status=status,
    )


def _require_auth(request: Request):
    auth = get_request_auth(request)
    if auth is None:
        return None, Response(
            {"error": "Unauthorized", "code": "UNAUTHORIZED"},
            status=401,
        )
    return auth, None


@api_view(["GET"])
@require_feature("ENABLE_COHORTS")
def cohorts_collection(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    cohort_type = request.query_params.get("cohort_type")
    is_active_param = request.query_params.get("is_active", "true")
    is_active = is_active_param.lower() != "false"

    cohorts = CohortService().list_cohorts(
        auth, cohort_type=cohort_type or None, is_active=is_active
    )
    return Response(
        {"results": [serialize_cohort(c) for c in cohorts]},
    )


@api_view(["GET"])
@require_feature("ENABLE_COHORTS")
def list_my_cohorts(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    memberships = CohortService().list_my_memberships(auth)
    return Response(
        {"results": [serialize_membership(m) for m in memberships]},
    )


@api_view(["GET"])
@require_feature("ENABLE_COHORTS")
def cohort_recommendations(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    profile = get_profile(auth)
    recommendations = RecommendationService().recommend(profile)
    return Response({"recommendations": recommendations})


@api_view(["POST"])
@require_feature("ENABLE_COHORTS")
def cohort_join(request: Request, cohort_id: UUID) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    try:
        result = CohortService().join(auth, cohort_id)
    except CohortNotFoundError as exc:
        return _error_response(exc, 404)
    except AlreadyInCohortError as exc:
        return Response(
            {"error": str(exc), "code": exc.code},
            status=409,
        )

    return Response(result, status=201)


@api_view(["POST"])
@require_feature("ENABLE_COHORTS")
def cohort_assign(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    user_id_raw = request.data.get("user_id")
    force_refresh = bool(request.data.get("force_refresh", False))
    target_user_id = UUID(user_id_raw) if user_id_raw else None

    try:
        assigned = CohortService().assign_all(
            auth,
            target_user_id=target_user_id,
            force_refresh=force_refresh,
        )
    except PermissionDeniedError as exc:
        return _error_response(exc, 403)

    return Response({"assigned": assigned})
