from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from users.auth.cognito_provider import CognitoAuthProvider
from users.auth.roles import resolve_platform_role
from users.models import PlatformRole


def test_resolve_platform_role_admin():
    assert resolve_platform_role(["admin"]) == PlatformRole.ADMIN


def test_resolve_platform_role_provider():
    assert resolve_platform_role(["provider"]) == PlatformRole.PROVIDER


def test_resolve_platform_role_parent_default():
    assert resolve_platform_role([]) == PlatformRole.PARENT


@pytest.mark.django_db
@patch.object(CognitoAuthProvider, "_verify_token")
def test_cognito_provider_authenticates_valid_token(mock_verify, organization, settings):
    settings.COGNITO_USER_POOL_ID = "us-east-1_TestPool"
    settings.COGNITO_USER_POOL_CLIENT_ID = "testclient"
    cognito_sub = str(uuid4())
    mock_verify.return_value = {
        "sub": cognito_sub,
        "token_use": "id",
        "cognito:groups": ["admin"],
        "name": "Test Admin",
    }

    provider = CognitoAuthProvider()
    context = provider.authenticate(f"Bearer eyJ.test.token")

    assert context is not None
    assert context.cognito_sub == cognito_sub
    assert context.platform_role == PlatformRole.ADMIN
    assert context.display_name == "Test Admin"


@pytest.mark.django_db
@patch.object(CognitoAuthProvider, "_verify_token")
def test_cognito_provider_ignores_dev_tokens(mock_verify, organization, settings):
    settings.COGNITO_USER_POOL_ID = "us-east-1_TestPool"
    settings.COGNITO_USER_POOL_CLIENT_ID = "testclient"
    provider = CognitoAuthProvider()
    context = provider.authenticate("Bearer dev:parent:abc")
    assert context is None
    mock_verify.assert_not_called()


@pytest.mark.django_db
@patch.object(CognitoAuthProvider, "_verify_token", return_value=None)
def test_cognito_provider_rejects_invalid_token(_mock_verify, organization, settings):
    settings.COGNITO_USER_POOL_ID = "us-east-1_TestPool"
    settings.COGNITO_USER_POOL_CLIENT_ID = "testclient"
    provider = CognitoAuthProvider()
    assert provider.authenticate("Bearer not-a-valid-jwt") is None


@pytest.mark.django_db
def test_chained_provider_prefers_dev_when_bypass_enabled(organization, settings):
    from users.auth.providers import get_auth_provider

    settings.JWT_DEV_BYPASS = True
    settings.COGNITO_USER_POOL_ID = "us-east-1_TestPool"
    settings.COGNITO_USER_POOL_CLIENT_ID = "testclient"

    user_id = uuid4()
    provider = get_auth_provider()
    context = provider.authenticate(f"Bearer dev:parent:{user_id}")

    assert context is not None
    assert context.user_id == user_id
