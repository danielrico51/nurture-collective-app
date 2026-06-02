from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware


class JwtAuthMiddleware(BaseMiddleware):
    """Authenticate WebSocket connections via ?token= (Cognito JWT or dev bypass)."""

    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            query = parse_qs(scope.get("query_string", b"").decode())
            token = query.get("token", [None])[0]
            scope["auth_context"] = None
            if token:
                header = f"Bearer {token}"
                scope["auth_context"] = await database_sync_to_async(
                    _authenticate
                )(header)
        return await super().__call__(scope, receive, send)


def _authenticate(authorization_header: str):
    from users.auth.providers import get_auth_provider

    return get_auth_provider().authenticate(authorization_header)
