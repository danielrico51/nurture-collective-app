from dataclasses import dataclass
from typing import Protocol


@dataclass
class AICompletionRequest:
    system_prompt: str
    user_message: str


class AIProvider(Protocol):
    def complete(self, request: AICompletionRequest) -> str: ...
