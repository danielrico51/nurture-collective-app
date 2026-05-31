from dataclasses import dataclass
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True)
class AuthContext:
    user_id: UUID
    cognito_sub: str
    organization_id: UUID
    platform_role: str
    display_name: str = ""


class AuthProviderInterface(Protocol):
    def authenticate(self, authorization_header: str | None) -> AuthContext | None: ...
