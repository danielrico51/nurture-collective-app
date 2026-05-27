from typing import Any, Callable

from services.schemas.event import EventActor

ActionHandler = Callable[..., dict[str, Any]]


class ActionExecutionError(Exception):
    pass


ACTION_REGISTRY: dict[str, ActionHandler] = {}


def register_action(name: str):
    def decorator(fn: ActionHandler) -> ActionHandler:
        ACTION_REGISTRY[name] = fn
        return fn
    return decorator


def get_action(name: str) -> ActionHandler:
    if name not in ACTION_REGISTRY:
        raise ActionExecutionError(f"Unknown action: {name}")
    return ACTION_REGISTRY[name]
