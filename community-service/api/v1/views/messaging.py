from uuid import UUID

from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from infrastructure.feature_flags import require_feature
from messaging.exceptions import (
    ChannelNotFoundError,
    MessagingError,
    NotChannelMemberError,
    PermissionDeniedError,
    ValidationError,
)
from messaging.serializers import serialize_channel_list_item
from messaging.services.channel_service import ChannelService
from messaging.services.message_service import MessageService
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
def channels_collection(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    if request.method == "GET":
        community_id = request.query_params.get("community_id")
        cid = _as_uuid(community_id) if community_id else None
        try:
            channels = ChannelService().list_for_user(auth, community_id=cid)
            results = [
                serialize_channel_list_item(channel, auth.user_id)
                for channel in channels
            ]
            return Response({"results": results})
        except MessagingError as exc:
            return _error_response(exc, 403 if exc.code == "PERMISSION_DENIED" else 400)

    data = request.data
    channel_type = data.get("channel_type")
    try:
        if channel_type == "group":
            channel = ChannelService().create_group(
                auth,
                community_id=_as_uuid(data["community_id"]),
                name=data.get("name", "General"),
            )
        elif channel_type == "direct":
            participants = data.get("participant_ids") or []
            if not participants:
                return Response(
                    {"error": "participant_ids required", "code": "VALIDATION_ERROR"},
                    status=400,
                )
            channel = ChannelService().create_direct(
                auth, participant_id=_as_uuid(participants[0])
            )
        else:
            return Response(
                {"error": "Invalid channel_type", "code": "VALIDATION_ERROR"},
                status=400,
            )
        return Response(
            {
                "channel_id": str(channel.id),
                "channel_type": channel.channel_type,
                "community_id": str(channel.community_id)
                if channel.community_id
                else None,
                "name": channel.name,
                "metadata": channel.metadata,
                "created_at": channel.created_at.isoformat().replace("+00:00", "Z"),
            },
            status=201,
        )
    except MessagingError as exc:
        status = 403 if exc.code == "PERMISSION_DENIED" else 400
        return _error_response(exc, status)


@api_view(["GET", "POST"])
@require_feature("ENABLE_GROUP_CHAT")
def channel_messages(request: Request, channel_id: UUID) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    cid = _as_uuid(channel_id)
    svc = MessageService()

    if request.method == "GET":
        cursor = request.query_params.get("cursor")
        limit = int(request.query_params.get("limit", 50))
        try:
            messages, next_cursor = svc.list_history(
                auth,
                cid,
                cursor=_as_uuid(cursor) if cursor else None,
                limit=limit,
            )
            return Response(
                {
                    "messages": [svc.serialize_message(m) for m in messages],
                    "next_cursor": next_cursor,
                }
            )
        except (ChannelNotFoundError, NotChannelMemberError) as exc:
            return _error_response(exc, 404 if exc.code == "NOT_FOUND" else 403)

    try:
        message = svc.send(
            auth,
            cid,
            body=request.data.get("message", ""),
            metadata=request.data.get("metadata") or {},
        )
        return Response(svc.serialize_message(message), status=201)
    except MessagingError as exc:
        status = 404 if exc.code == "NOT_FOUND" else 403
        if exc.code == "VALIDATION_ERROR":
            status = 400
        return _error_response(exc, status)


@api_view(["POST"])
@require_feature("ENABLE_GROUP_CHAT")
def channel_mark_read(request: Request, channel_id: UUID) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err

    message_id = request.data.get("message_id")
    try:
        member = MessageService().mark_read(
            auth,
            _as_uuid(channel_id),
            message_id=_as_uuid(message_id) if message_id else None,
        )
        return Response(
            {
                "channel_id": str(channel_id),
                "last_read_at": member.last_read_at.isoformat().replace("+00:00", "Z"),
            }
        )
    except MessagingError as exc:
        return _error_response(exc, 404 if exc.code == "NOT_FOUND" else 403)
