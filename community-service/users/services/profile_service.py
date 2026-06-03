from __future__ import annotations

from users.auth.base import AuthContext
from users.models import UserProfile


def get_profile(auth: AuthContext) -> UserProfile:
    return UserProfile.objects.select_related("organization").get(id=auth.user_id)


def update_profile(
    auth: AuthContext,
    *,
    display_name: str | None = None,
    avatar_url: str | None = None,
    profile_metadata: dict | None = None,
) -> UserProfile:
    profile = get_profile(auth)
    updates: list[str] = []

    if display_name is not None:
        profile.display_name = display_name.strip()[:255]
        updates.append("display_name")

    if avatar_url is not None:
        meta = dict(profile.profile_metadata or {})
        cleaned = avatar_url.strip()
        if cleaned:
            meta["avatar_url"] = cleaned
        else:
            meta.pop("avatar_url", None)
        profile.profile_metadata = meta
        updates.append("profile_metadata")

    if profile_metadata is not None:
        meta = dict(profile.profile_metadata or {})
        for key, value in profile_metadata.items():
            if value is None:
                meta.pop(key, None)
            else:
                meta[key] = value
        profile.profile_metadata = meta
        updates.append("profile_metadata")

    if updates:
        profile.save(update_fields=updates + ["updated_at"])

    return profile


def avatar_url_for_profile(profile: UserProfile) -> str:
    meta = profile.profile_metadata or {}
    url = meta.get("avatar_url")
    return url if isinstance(url, str) else ""
