from unittest.mock import patch

import pytest

from ai_companion.models import PromptVersion
from ai_companion.prompts.templates import DAILY_CHECKIN_V1, QA_V1, RECOMMEND_V1


@pytest.fixture
def seed_prompts(db):
    for slug, template in (
        ("daily_checkin_v1", DAILY_CHECKIN_V1),
        ("qa_v1", QA_V1),
        ("recommend_v1", RECOMMEND_V1),
    ):
        PromptVersion.objects.get_or_create(
            slug=slug,
            version=1,
            defaults={"template": template, "is_active": True},
        )


@pytest.mark.django_db
def test_ai_endpoints_disabled_by_default(auth_client):
    response = auth_client.post("/api/v1/ai/checkin/", {}, format="json")
    assert response.status_code == 503
    assert response.json()["code"] == "FEATURE_DISABLED"


@pytest.mark.django_db
@patch("infrastructure.feature_flags.FLAGS", {"ENABLE_AI": True})
def test_ai_checkin_when_enabled(auth_client, seed_prompts):
    response = auth_client.post("/api/v1/ai/checkin/", {}, format="json")
    assert response.status_code == 200
    body = response.json()
    assert body["conversation_id"]
    assert body["safety_passed"] is True
    assert body["message"]


@pytest.mark.django_db
@patch("infrastructure.feature_flags.FLAGS", {"ENABLE_AI": True})
def test_ai_ask_emits_event(auth_client, seed_prompts):
    with patch("ai_companion.services.companion_service.emit_event") as mock_emit:
        response = auth_client.post(
            "/api/v1/ai/ask/",
            {"question": "Is cluster feeding normal?"},
            format="json",
        )
    assert response.status_code == 200
    assert response.json()["message"]
    mock_emit.assert_called_once()
    assert mock_emit.call_args[0][0].event_type == "ai_question_asked"


@pytest.mark.django_db
@patch("infrastructure.feature_flags.FLAGS", {"ENABLE_AI": True})
def test_ai_escalate_returns_202(auth_client, seed_prompts):
    response = auth_client.post(
        "/api/v1/ai/escalate/",
        {"reason": "Need a coordinator", "urgency": "high"},
        format="json",
    )
    assert response.status_code == 202
    assert response.json()["status"] == "queued"
