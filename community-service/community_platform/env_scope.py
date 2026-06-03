from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest

ALLOWED_ENV_SCOPES = frozenset({"dev", "staging", "production"})
REQUEST_ENV_SCOPE_ATTR = "community_env_scope"


def normalize_env_scope(value: str | None) -> str:
    cleaned = (value or "").strip().lower()
    if cleaned in ALLOWED_ENV_SCOPES:
        return cleaned
    default = getattr(settings, "COMMUNITY_ENV_SCOPE", "production").strip().lower()
    if default in ALLOWED_ENV_SCOPES:
        return default
    return "production"


def resolve_env_scope_from_request(request: HttpRequest) -> str:
    header = request.headers.get("X-Community-Env-Scope")
    return normalize_env_scope(header)


def get_request_env_scope(request: HttpRequest) -> str:
    cached = getattr(request, REQUEST_ENV_SCOPE_ATTR, None)
    if isinstance(cached, str) and cached in ALLOWED_ENV_SCOPES:
        return cached
    scope = resolve_env_scope_from_request(request)
    setattr(request, REQUEST_ENV_SCOPE_ATTR, scope)
    return scope
