from uuid import uuid4

import pytest
from django.test import RequestFactory

from users.auth.dev_provider import DevAuthProvider
from users.middleware import AuthMiddleware, get_request_auth


@pytest.mark.django_db
def test_dev_provider_parses_bypass_token(organization):
    user_id = uuid4()
    provider = DevAuthProvider()
    context = provider.authenticate(f"Bearer dev:parent:{user_id}")
    assert context is not None
    assert context.user_id == user_id
    assert context.cognito_sub == str(user_id)
    assert context.platform_role == "parent"


@pytest.mark.django_db
def test_dev_provider_accepts_cognito_sub_string(organization):
    provider = DevAuthProvider()
    context = provider.authenticate("Bearer dev:parent:seed-demo-parent-1")
    assert context is not None
    assert context.cognito_sub == "seed-demo-parent-1"
    assert context.platform_role == "parent"


@pytest.mark.django_db
def test_middleware_injects_auth_context(organization):
    user_id = uuid4()
    factory = RequestFactory()
    request = factory.get(
        "/api/v1/communities/",
        HTTP_AUTHORIZATION=f"Bearer dev:parent:{user_id}",
    )

    def get_response(req):
        auth = get_request_auth(req)
        assert auth is not None
        from django.http import JsonResponse

        return JsonResponse({"ok": True})

    middleware = AuthMiddleware(get_response)
    response = middleware(request)
    assert response.status_code == 200


@pytest.mark.django_db
def test_middleware_rejects_missing_auth():
    factory = RequestFactory()
    request = factory.get("/api/v1/communities/")

    def get_response(_req):
        pytest.fail("should not reach view")

    middleware = AuthMiddleware(get_response)
    response = middleware(request)
    assert response.status_code == 401
