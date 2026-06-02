from django.conf import settings

from users.auth.base import AuthContext, AuthProviderInterface
from users.auth.cognito_provider import CognitoAuthProvider
from users.auth.dev_provider import DevAuthProvider


class ChainedAuthProvider:
    def __init__(self, providers: list[AuthProviderInterface]) -> None:
        self.providers = providers

    def authenticate(self, authorization_header: str | None) -> AuthContext | None:
        for provider in self.providers:
            context = provider.authenticate(authorization_header)
            if context is not None:
                return context
        return None


def get_auth_provider() -> AuthProviderInterface:
    providers: list[AuthProviderInterface] = []

    if settings.JWT_DEV_BYPASS:
        providers.append(DevAuthProvider())

    cognito = CognitoAuthProvider()
    if cognito.is_configured:
        providers.append(cognito)

    if not providers:
        raise RuntimeError(
            "No auth providers configured. Set JWT_DEV_BYPASS=true for local dev "
            "or configure COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID."
        )

    return ChainedAuthProvider(providers)
