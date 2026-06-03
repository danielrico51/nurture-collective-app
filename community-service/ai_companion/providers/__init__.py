import os

from ai_companion.providers.base import AIProvider
from ai_companion.providers.openai_provider import OpenAIProvider
from ai_companion.providers.stub import StubProvider


def get_ai_provider() -> AIProvider:
    provider = os.environ.get("AI_PROVIDER", "stub").strip().lower()
    if provider == "openai":
        return OpenAIProvider()
    return StubProvider()
