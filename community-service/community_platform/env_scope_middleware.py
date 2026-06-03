from typing import Callable

from django.http import HttpRequest, HttpResponse

from community_platform.env_scope import REQUEST_ENV_SCOPE_ATTR, resolve_env_scope_from_request


class CommunityEnvScopeMiddleware:
    """Attach deployment scope (dev vs production) for branch-isolated posts."""

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        setattr(request, REQUEST_ENV_SCOPE_ATTR, resolve_env_scope_from_request(request))
        return self.get_response(request)
