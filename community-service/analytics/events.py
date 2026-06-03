from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


@dataclass
class CommunityEvent:
    event_type: str
    domain: str
    organization_id: str
    user_id: str | None = None
    properties: dict[str, Any] = field(default_factory=dict)
    event_id: str = field(default_factory=lambda: str(uuid4()))
    occurred_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    schema_version: int = 1


EVENT_COMMUNITY_CREATED = "community_created"
EVENT_COMMUNITY_JOINED = "community_joined"
EVENT_COMMUNITY_LEFT = "community_left"
EVENT_MEMBERSHIP_ROLE_CHANGED = "membership_role_changed"
EVENT_MESSAGE_SENT = "message_sent"
EVENT_MESSAGE_READ = "message_read"
EVENT_COHORT_ASSIGNED = "cohort_assigned"
EVENT_POST_CREATED = "post_created"
EVENT_POST_UPDATED = "post_updated"
EVENT_POST_DELETED = "post_deleted"
EVENT_COMMENT_CREATED = "comment_created"
EVENT_REACTION_ADDED = "reaction_added"
EVENT_REACTION_REMOVED = "reaction_removed"
EVENT_AI_QUESTION_ASKED = "ai_question_asked"
