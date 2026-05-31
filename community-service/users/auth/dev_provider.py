from uuid import UUID

from django.conf import settings

from users.auth.base import AuthContext
from users.models import Organization, PlatformRole, UserProfile


def _parse_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except ValueError:
        return None


class DevAuthProvider:
    """Local dev auth: Authorization: Bearer dev:{role}:{user_id_or_cognito_sub}"""

    PREFIX = "dev:"

    def _default_organization(self) -> Organization:
        org = Organization.objects.filter(slug="nurture-collective").first()
        if org is None:
            org = Organization.objects.first()
        if org is None:
            org = Organization.objects.create(
                name="Nurture Collective LLC",
                slug="nurture-collective",
            )
        return org

    def _resolve_profile(self, subject: str, role: str) -> UserProfile:
        org = self._default_organization()
        subject_uuid = _parse_uuid(subject)

        profile = None
        if subject_uuid is not None:
            profile = UserProfile.objects.filter(id=subject_uuid).first()
        if profile is None:
            profile = UserProfile.objects.filter(cognito_sub=subject).first()

        if profile is None:
            create_kwargs = {
                "cognito_sub": subject,
                "organization": org,
                "platform_role": role,
                "display_name": f"Dev {role}",
            }
            if subject_uuid is not None:
                create_kwargs["id"] = subject_uuid
            profile = UserProfile.objects.create(**create_kwargs)
        else:
            updates: list[str] = []
            if profile.platform_role != role:
                profile.platform_role = role
                updates.append("platform_role")
            if profile.organization_id != org.id:
                profile.organization = org
                updates.append("organization")
            if updates:
                updates.append("updated_at")
                profile.save(update_fields=updates)

        return profile

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

        profile = self._resolve_profile(subject, role)

        return AuthContext(
            user_id=profile.id,
            cognito_sub=profile.cognito_sub,
            organization_id=profile.organization_id,
            platform_role=profile.platform_role,
            display_name=profile.display_name,
        )


def get_auth_provider():
    if settings.JWT_DEV_BYPASS:
        return DevAuthProvider()
    # TODO: CognitoAuthProvider when shared/auth is wired
    return DevAuthProvider()
