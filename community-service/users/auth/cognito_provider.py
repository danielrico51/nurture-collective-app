import logging
from typing import Any

import jwt
from django.conf import settings
from jwt import PyJWKClient

from users.auth.base import AuthContext
from users.auth.profiles import profile_to_auth_context, resolve_profile
from users.auth.roles import resolve_platform_role

logger = logging.getLogger(__name__)


class CognitoAuthProvider:
    """Validate Cognito ID tokens (same pool/client as the Next.js member app)."""

    def __init__(self) -> None:
        self.region = settings.COGNITO_REGION
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        self.client_id = settings.COGNITO_USER_POOL_CLIENT_ID
        self._jwks_client: PyJWKClient | None = None
        self._issuer: str | None = None

        if self.user_pool_id:
            self._issuer = (
                f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}"
            )
            jwks_url = f"{self._issuer}/.well-known/jwks.json"
            self._jwks_client = PyJWKClient(jwks_url, cache_keys=True)

    @property
    def is_configured(self) -> bool:
        return bool(self.user_pool_id and self.client_id and self._jwks_client)

    def _verify_token(self, token: str) -> dict[str, Any] | None:
        if not self.is_configured or not self._jwks_client or not self._issuer:
            return None

        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.client_id,
                issuer=self._issuer,
                options={"verify_exp": True},
            )
        except jwt.PyJWTError as exc:
            logger.debug("Cognito JWT verification failed: %s", exc)
            return None

        token_use = payload.get("token_use")
        if token_use != "id":
            logger.debug("Rejected Cognito token with token_use=%s", token_use)
            return None

        sub = payload.get("sub")
        if not sub:
            return None

        return payload

    def _display_name_from_claims(self, claims: dict[str, Any]) -> str:
        for key in ("name", "given_name", "preferred_username", "email"):
            value = claims.get(key)
            if value:
                return str(value)
        return ""

    def authenticate(self, authorization_header: str | None) -> AuthContext | None:
        if not authorization_header or not authorization_header.startswith("Bearer "):
            return None

        token = authorization_header.removeprefix("Bearer ").strip()
        if not token or token.startswith("dev:"):
            return None

        claims = self._verify_token(token)
        if claims is None:
            return None

        cognito_sub = str(claims["sub"])
        groups = claims.get("cognito:groups")
        platform_role = resolve_platform_role(groups)
        display_name = self._display_name_from_claims(claims)

        profile = resolve_profile(
            cognito_sub=cognito_sub,
            platform_role=platform_role,
            display_name=display_name,
        )
        return profile_to_auth_context(profile)
