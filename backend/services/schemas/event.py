from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class EventActor(BaseModel):
    type: Literal["system", "user", "coordinator", "management"] = "system"
    id: str = ""


class PlatformEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid4().hex}")
    event_type: str
    entity_type: Literal["lead", "client"]
    entity_id: str
    timestamp: str
    actor: EventActor
    payload: dict[str, Any] = Field(default_factory=dict)
