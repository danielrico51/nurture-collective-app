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
