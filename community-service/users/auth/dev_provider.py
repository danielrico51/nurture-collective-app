from uuid import UUID

from users.auth.base import AuthContext
from users.auth.profiles import profile_to_auth_context, resolve_profile
from users.models import PlatformRole


def _parse_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except ValueError:
        return None


class DevAuthProvider:
    """Local dev auth: Authorization: Bearer dev:{role}:{user_id_or_cognito_sub}"""

    PREFIX = "dev:"

    def authenticate(self, authorization_header: str | None) -> AuthContext | None:
        if not authorization_header or not authorization_header.startswith("Bearer "):
            return None

        token = authorization_header.removeprefix("Bearer ").strip()
        if not token.startswith(self.PREFIX):
            return None

        parts = token.split(":")
        if len(parts) != 3:
            return None

        _, role, subject = parts
        if role not in PlatformRole.values:
            return None

        profile = resolve_profile(
            cognito_sub=subject,
            platform_role=role,
            display_name=f"Dev {role}",
            profile_id=_parse_uuid(subject),
        )
        return profile_to_auth_context(profile)
