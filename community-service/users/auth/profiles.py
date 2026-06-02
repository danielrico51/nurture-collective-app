from uuid import UUID

from users.auth.base import AuthContext
from users.models import Organization, UserProfile


def _parse_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except ValueError:
        return None


def default_organization() -> Organization:
    org = Organization.objects.filter(slug="nurture-collective").first()
    if org is None:
        org = Organization.objects.first()
    if org is None:
        org = Organization.objects.create(
            name="Nurture Collective LLC",
            slug="nurture-collective",
        )
    return org


def resolve_profile(
    *,
    cognito_sub: str,
    platform_role: str,
    display_name: str = "",
    profile_id: UUID | None = None,
) -> UserProfile:
    org = default_organization()

    profile = None
    if profile_id is not None:
        profile = UserProfile.objects.filter(id=profile_id).first()
    if profile is None:
        profile = UserProfile.objects.filter(cognito_sub=cognito_sub).first()

    if profile is None:
        create_kwargs = {
            "cognito_sub": cognito_sub,
            "organization": org,
            "platform_role": platform_role,
            "display_name": display_name,
        }
        if profile_id is not None:
            create_kwargs["id"] = profile_id
        profile = UserProfile.objects.create(**create_kwargs)
    else:
        updates: list[str] = []
        if display_name and profile.display_name != display_name:
            profile.display_name = display_name
            updates.append("display_name")
        if profile.platform_role != platform_role:
            profile.platform_role = platform_role
            updates.append("platform_role")
        if profile.organization_id != org.id:
            profile.organization = org
            updates.append("organization")
        if updates:
            updates.append("updated_at")
            profile.save(update_fields=updates)

    return profile


def profile_to_auth_context(profile: UserProfile) -> AuthContext:
    return AuthContext(
        user_id=profile.id,
        cognito_sub=profile.cognito_sub,
        organization_id=profile.organization_id,
        platform_role=profile.platform_role,
        display_name=profile.display_name,
    )
