from typing import Any
from uuid import UUID

from analytics.emitter import emit_event
from analytics.events import CommunityEvent
from users.auth.base import AuthContext


def emit_messaging_discussion_event(
    event_type: str,
    auth: AuthContext,
    *,
    community_id: UUID,
    env_scope: str | None = None,
    post_id: UUID | None = None,
    comment_id: UUID | None = None,
    extra: dict[str, Any] | None = None,
) -> str:
    properties: dict[str, Any] = {"community_id": str(community_id)}
    if post_id:
        properties["post_id"] = str(post_id)
    if comment_id:
        properties["comment_id"] = str(comment_id)
    if env_scope:
        properties["env_scope"] = env_scope
    if extra:
        properties.update(extra)

    return emit_event(
        CommunityEvent(
            event_type=event_type,
            domain="messaging",
            organization_id=str(auth.organization_id),
            user_id=str(auth.user_id),
            properties=properties,
        )
    )
