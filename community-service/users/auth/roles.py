from django.conf import settings


def _normalize_groups(groups: list[str] | str | None) -> list[str]:
    if groups is None:
        return []
    if isinstance(groups, str):
        return [groups]
    return [str(group) for group in groups]


def resolve_platform_role(groups: list[str] | str | None) -> str:
    """Map Cognito groups to community-service platform roles."""
    from users.models import PlatformRole

    normalized = {group.lower() for group in _normalize_groups(groups)}
    admin_group = settings.COGNITO_ADMIN_GROUP.lower()
    provider_group = settings.COGNITO_PROVIDER_GROUP.lower()

    if admin_group in normalized:
        return PlatformRole.ADMIN
    if provider_group and provider_group in normalized:
        return PlatformRole.PROVIDER
    return PlatformRole.PARENT
