from uuid import UUID

from django.core.paginator import Paginator
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from communities.exceptions import (
    AlreadyMemberError,
    CommunityError,
    CommunityNotFoundError,
    FeatureDisabledError,
    NotMemberError,
    PermissionDeniedError,
)
from communities.serializers import (
    CommunityCreateSerializer,
    CommunityDetailSerializer,
    CommunityListSerializer,
    MyCommunitySerializer,
    MembershipSerializer,
)
from communities.services.community_service import CommunityService
from communities.services.membership_service import MembershipService
from communities.services.query_service import CommunityQueryService
from infrastructure.feature_flags import is_enabled, require_feature
from users.middleware import get_request_auth


def _error_response(exc: CommunityError, status: int) -> Response:
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


def _as_uuid(value: UUID | str) -> UUID:
    return value if isinstance(value, UUID) else UUID(value)


@api_view(["GET", "POST"])
@require_feature("ENABLE_COMMUNITIES")
def communities_collection(request: Request) -> Response:
    if request.method == "POST":
        return _create_community(request)
    return _list_communities(request)


def _create_community(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    serializer = CommunityCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        community = CommunityService().create(
            auth,
            name=data["name"],
            description=data.get("description", ""),
            visibility=data["visibility"],
            tags=data.get("tags", []),
        )
    except PermissionDeniedError as exc:
        return _error_response(exc, 403)

    return Response(
        {
            "community_id": str(community.id),
            "organization_id": str(community.organization_id),
            "name": community.name,
            "description": community.description,
            "visibility": community.visibility,
            "tags": community.tags,
            "member_count": 0,
            "created_at": community.created_at,
            "updated_at": community.updated_at,
        },
        status=201,
    )


def _list_communities(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    visibility = request.query_params.get("visibility")
    tag = request.query_params.get("tag")
    page = int(request.query_params.get("page", 1))
    page_size = min(int(request.query_params.get("page_size", 20)), 100)

    qs = CommunityQueryService().list_discoverable(
        auth, visibility=visibility, tag=tag
    )
    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)

    results = CommunityListSerializer(page_obj.object_list, many=True).data
    return Response(
        {
            "count": paginator.count,
            "next": page + 1 if page_obj.has_next() else None,
            "previous": page - 1 if page_obj.has_previous() else None,
            "results": results,
        }
    )


@api_view(["GET"])
@require_feature("ENABLE_COMMUNITIES")
def get_community(request: Request, community_id: UUID) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    community, membership = CommunityQueryService().get_detail(auth, _as_uuid(community_id))
    if community is None:
        return Response(
            {"error": "Community not found", "code": "NOT_FOUND"},
            status=404,
        )

    payload = CommunityDetailSerializer(community).data
    payload["my_membership"] = (
        MembershipSerializer(membership).data if membership else None
    )
    return Response(payload)


@api_view(["GET"])
@require_feature("ENABLE_COMMUNITIES")
def list_my_communities(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    memberships = CommunityQueryService().list_my_communities(auth)
    return Response(
        {
            "results": MyCommunitySerializer(memberships, many=True).data,
        }
    )


@api_view(["POST"])
@require_feature("ENABLE_COMMUNITIES")
def join_community(request: Request, community_id: UUID) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    try:
        membership = MembershipService().join(auth, _as_uuid(community_id))
    except CommunityNotFoundError:
        return Response(
            {"error": "Community not found", "code": "NOT_FOUND"},
            status=404,
        )
    except PermissionDeniedError as exc:
        return _error_response(exc, 403)
    except AlreadyMemberError as exc:
        return _error_response(exc, 409)

    return Response(MembershipSerializer(membership).data, status=201)


@api_view(["POST"])
@require_feature("ENABLE_COMMUNITIES")
def leave_community(request: Request, community_id: UUID) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    try:
        membership = MembershipService().leave(auth, _as_uuid(community_id))
    except NotMemberError as exc:
        return _error_response(exc, 404)

    return Response(
        {
            "community_id": str(membership.community_id),
            "left_at": membership.left_at,
        }
    )
