from uuid import UUID

from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from ai_companion.exceptions import (
    AICompanionError,
    ConversationNotFoundError,
    SafetyBlockedError,
    ValidationError,
)
from ai_companion.services.companion_service import CompanionService
from infrastructure.feature_flags import require_feature
from users.middleware import get_request_auth


def _error_response(exc: AICompanionError, status: int) -> Response:
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


def _parse_uuid(value) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        return None


@api_view(["POST"])
@require_feature("ENABLE_AI")
def ai_checkin(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err
    try:
        payload = CompanionService().daily_checkin(auth)
        return Response(payload, status=200)
    except ValidationError as exc:
        return _error_response(exc, 400)


@api_view(["POST"])
@require_feature("ENABLE_AI")
def ai_ask(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err
    try:
        payload = CompanionService().ask_question(
            auth,
            question=request.data.get("question", ""),
            conversation_id=_parse_uuid(request.data.get("conversation_id")),
        )
        return Response(payload, status=200)
    except ValidationError as exc:
        return _error_response(exc, 400)
    except SafetyBlockedError as exc:
        return _error_response(exc, 403)
    except ConversationNotFoundError as exc:
        return _error_response(exc, 404)


@api_view(["POST"])
@require_feature("ENABLE_AI")
def ai_recommend(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err
    try:
        payload = CompanionService().recommend_resources(
            auth,
            topic=request.data.get("topic", ""),
            conversation_id=_parse_uuid(request.data.get("conversation_id")),
        )
        return Response(payload, status=200)
    except ValidationError as exc:
        return _error_response(exc, 400)
    except SafetyBlockedError as exc:
        return _error_response(exc, 403)
    except ConversationNotFoundError as exc:
        return _error_response(exc, 404)


@api_view(["POST"])
@require_feature("ENABLE_AI")
def ai_escalate(request: Request) -> Response:
    auth, err = _require_auth(request)
    if err:
        return err
    try:
        payload = CompanionService().escalate_to_human(
            auth,
            conversation_id=_parse_uuid(request.data.get("conversation_id")),
            reason=request.data.get("reason", ""),
            urgency=request.data.get("urgency", "normal"),
        )
        return Response(payload, status=202)
    except ConversationNotFoundError as exc:
        return _error_response(exc, 404)
