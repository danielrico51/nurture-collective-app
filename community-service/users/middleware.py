import logging
from typing import Callable

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpRequest, HttpResponse, JsonResponse

from users.auth.base import AuthContext
from users.auth.providers import get_auth_provider

logger = logging.getLogger(__name__)

REQUEST_AUTH_ATTR = "auth_context"


def get_request_auth(request: HttpRequest) -> AuthContext | None:
    return getattr(request, REQUEST_AUTH_ATTR, None)


class AuthMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response
        self.provider = get_auth_provider()

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.path.startswith("/health/"):
            return self.get_response(request)

        auth_header = request.headers.get("Authorization")
        context = self.provider.authenticate(auth_header)
        if context is None and not request.path.startswith("/health"):
            if request.path.startswith("/api/"):
                return JsonResponse(
                    {"error": "Unauthorized", "code": "UNAUTHORIZED"},
                    status=401,
                )

        setattr(request, REQUEST_AUTH_ATTR, context)
        return self.get_response(request)


def validate_dev_bypass_settings() -> None:
    if settings.JWT_DEV_BYPASS:
        allowed_hosts = set(settings.ALLOWED_HOSTS)
        is_local = settings.DEBUG and (
            allowed_hosts <= {"localhost", "127.0.0.1", "app", "*"}
            or "localhost" in allowed_hosts
        )
        if not is_local:
            raise ImproperlyConfigured(
                "JWT_DEV_BYPASS=true is only allowed in local/dev environments."
            )
        logger.warning(
            "JWT_DEV_BYPASS is enabled — do not use in staging or production."
        )

    if not settings.JWT_DEV_BYPASS and (
        not settings.COGNITO_USER_POOL_ID or not settings.COGNITO_USER_POOL_CLIENT_ID
    ):
        raise ImproperlyConfigured(
            "COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID are required "
            "when JWT_DEV_BYPASS is false."
        )
