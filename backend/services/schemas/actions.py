from typing import Any, Literal

from pydantic import BaseModel, Field


class ActionExecuteRequest(BaseModel):
    entity_type: Literal["lead", "client"]
    entity_id: str
    action: str
    params: dict[str, Any] = Field(default_factory=dict)
