from typing import Any

from services.actions import handlers  # noqa: F401 — registers actions
from services.actions.registry import ActionExecutionError, get_action
from services.schemas.event import EventActor


def execute_action(
    entity_type: str,
    entity_id: str,
    action: str,
    params: dict[str, Any] | None = None,
    actor: str = "system",
) -> dict[str, Any]:
    handler = get_action(action)
    actor_model = EventActor(
        type="coordinator" if actor != "system" else "system",
        id=actor,
    )
    try:
        return handler(
            entity_type=entity_type,
            entity_id=entity_id,
            params=params or {},
            actor=actor_model,
        )
    except ActionExecutionError:
        raise
    except Exception as exc:
        raise ActionExecutionError(str(exc)) from exc
