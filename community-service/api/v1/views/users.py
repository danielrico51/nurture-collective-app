from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from users.middleware import get_request_auth
from users.services.profile_service import avatar_url_for_profile, get_profile, update_profile


def _serialize_profile(profile) -> dict:
    return {
        "user_id": str(profile.id),
        "display_name": profile.display_name or "",
        "avatar_url": avatar_url_for_profile(profile),
        "platform_role": profile.platform_role,
    }


@api_view(["GET", "PATCH"])
def current_user(request: Request) -> Response:
    auth = get_request_auth(request)
    if auth is None:
        return Response({"error": "Unauthorized"}, status=401)

    if request.method == "GET":
        profile = get_profile(auth)
        return Response(_serialize_profile(profile))

    display_name = request.data.get("display_name")
    avatar_url = request.data.get("avatar_url")
    if display_name is None and avatar_url is None:
        return Response(
            {"error": "Provide display_name and/or avatar_url"},
            status=400,
        )

    profile = update_profile(
        auth,
        display_name=display_name if display_name is not None else None,
        avatar_url=avatar_url if avatar_url is not None else None,
    )
    return Response(_serialize_profile(profile))
