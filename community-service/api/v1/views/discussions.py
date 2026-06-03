from uuid import UUID

from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from community_platform.env_scope import get_request_env_scope
from infrastructure.feature_flags import require_feature
from messaging.exceptions import ChannelNotFoundError, MessagingError, PermissionDeniedError
from messaging.services.discussion_service import DiscussionService
from users.middleware import get_request_auth


def _error_response(exc: MessagingError, status: int) -> Response:
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
    return value if isinstance(value, UUID) else UUID(str(value))


@api_view(["GET", "POST"])
@require_feature("ENABLE_GROUP_CHAT")
def community_posts(request: Request, community_id: UUID) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    cid = _as_uuid(community_id)
    env_scope = get_request_env_scope(request)
    svc = DiscussionService()

    if request.method == "GET":
        cursor = request.query_params.get("cursor")
        limit = int(request.query_params.get("limit", 30))
        try:
            posts, next_cursor = svc.list_posts(
                auth,
                cid,
                env_scope=env_scope,
                cursor=_as_uuid(cursor) if cursor else None,
                limit=limit,
            )
            return Response(
                {
                    "results": [svc.serialize_post(p) for p in posts],
                    "next_cursor": next_cursor,
                }
            )
        except MessagingError as exc:
            return _error_response(exc, 403 if exc.code == "PERMISSION_DENIED" else 400)

    try:
        post = svc.create_post(
            auth,
            cid,
            env_scope=env_scope,
            title=request.data.get("title", ""),
            body=request.data.get("body", ""),
            image_urls=request.data.get("image_urls"),
        )
        return Response(svc.serialize_post(post), status=201)
    except MessagingError as exc:
        status = 400 if exc.code in ("VALIDATION_ERROR",) else 403
        return _error_response(exc, status)


@api_view(["GET", "PATCH", "DELETE"])
@require_feature("ENABLE_GROUP_CHAT")
def community_post_detail(
    request: Request, community_id: UUID, post_id: UUID
) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    cid = _as_uuid(community_id)
    pid = _as_uuid(post_id)
    env_scope = get_request_env_scope(request)
    svc = DiscussionService()

    if request.method == "GET":
        try:
            post = svc.get_post(auth, cid, pid, env_scope=env_scope)
            return Response(DiscussionService.serialize_post(post))
        except ChannelNotFoundError as exc:
            return _error_response(exc, 404)
        except MessagingError as exc:
            return _error_response(exc, 403)

    if request.method == "DELETE":
        try:
            svc.delete_post(auth, cid, pid, env_scope=env_scope)
            return Response(status=204)
        except ChannelNotFoundError as exc:
            return _error_response(exc, 404)
        except MessagingError as exc:
            return _error_response(exc, 403)

    try:
        data = request.data
        has_title = "title" in data
        has_body = "body" in data
        has_images = "image_urls" in data
        if not (has_title or has_body or has_images):
            return Response(
                {"error": "Provide title, body, and/or image_urls to update"},
                status=400,
            )
        post = svc.update_post(
            auth,
            cid,
            pid,
            env_scope=env_scope,
            title=data.get("title") if has_title else None,
            body=data.get("body") if has_body else None,
            image_urls=data.get("image_urls") if has_images else None,
        )
        return Response(DiscussionService.serialize_post(post))
    except ChannelNotFoundError as exc:
        return _error_response(exc, 404)
    except MessagingError as exc:
        status = 400 if exc.code == "VALIDATION_ERROR" else 403
        return _error_response(exc, status)


@api_view(["GET", "POST"])
@require_feature("ENABLE_GROUP_CHAT")
def post_comments(
    request: Request, community_id: UUID, post_id: UUID
) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    cid = _as_uuid(community_id)
    pid = _as_uuid(post_id)
    env_scope = get_request_env_scope(request)
    svc = DiscussionService()

    if request.method == "GET":
        try:
            comments = svc.list_comments(auth, cid, pid, env_scope=env_scope)
            return Response(
                {"comments": svc.build_comment_tree(comments)}
            )
        except ChannelNotFoundError as exc:
            return _error_response(exc, 404)
        except MessagingError as exc:
            return _error_response(exc, 403)

    parent = request.data.get("parent_id")
    try:
        comment = svc.create_comment(
            auth,
            cid,
            pid,
            env_scope=env_scope,
            body=request.data.get("body", ""),
            parent_id=_as_uuid(parent) if parent else None,
        )
        return Response(svc.serialize_comment(comment), status=201)
    except ChannelNotFoundError as exc:
        return _error_response(exc, 404)
    except MessagingError as exc:
        status = 400 if exc.code == "VALIDATION_ERROR" else 403
        return _error_response(exc, status)


@api_view(["POST", "DELETE"])
@require_feature("ENABLE_GROUP_CHAT")
def post_reactions(
    request: Request, community_id: UUID, post_id: UUID
) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    cid = _as_uuid(community_id)
    pid = _as_uuid(post_id)
    env_scope = get_request_env_scope(request)
    svc = DiscussionService()

    if request.method == "DELETE":
        try:
            reactions = svc.remove_post_reaction(
                auth, cid, pid, env_scope=env_scope
            )
            return Response({"reactions": reactions})
        except ChannelNotFoundError as exc:
            return _error_response(exc, 404)
        except MessagingError as exc:
            return _error_response(exc, 403)

    try:
        reactions = svc.set_post_reaction(
            auth,
            cid,
            pid,
            env_scope=env_scope,
            reaction_type=request.data.get("reaction_type", ""),
        )
        return Response({"reactions": reactions})
    except ChannelNotFoundError as exc:
        return _error_response(exc, 404)
    except MessagingError as exc:
        status = 400 if exc.code == "VALIDATION_ERROR" else 403
        return _error_response(exc, status)
