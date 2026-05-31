"""Feature flags — injectable, environment-configurable."""

import os
from functools import wraps
from typing import Callable

FLAGS = {
    "ENABLE_COMMUNITIES": os.environ.get("ENABLE_COMMUNITIES", "true").lower() == "true",
    "ENABLE_GROUP_CHAT": os.environ.get("ENABLE_GROUP_CHAT", "true").lower() == "true",
    "ENABLE_COHORTS": os.environ.get("ENABLE_COHORTS", "false").lower() == "true",
    "ENABLE_AI": os.environ.get("ENABLE_AI", "false").lower() == "true",
}


def is_enabled(flag: str) -> bool:
    return FLAGS.get(flag, False)


def require_feature(flag: str) -> Callable:
    """Decorator for views — returns 503 when flag disabled. Implement in Sprint 1."""

    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            if not is_enabled(flag):
                from django.http import JsonResponse

                return JsonResponse(
                    {"error": f"Feature {flag} is disabled", "code": "FEATURE_DISABLED"},
                    status=503,
                )
            return view_func(*args, **kwargs)

        return wrapper

    return decorator
