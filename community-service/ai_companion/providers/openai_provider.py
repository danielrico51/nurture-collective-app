import logging

from django.conf import settings

from ai_companion.providers.base import AICompletionRequest, AIProvider
from ai_companion.providers.stub import StubProvider

logger = logging.getLogger(__name__)


class OpenAIProvider:
    def complete(self, request: AICompletionRequest) -> str:
        api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        if not api_key.strip():
            return StubProvider().complete(request)

        try:
            from openai import OpenAI

            client = OpenAI(api_key=api_key)
            model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": request.system_prompt},
                    {"role": "user", "content": request.user_message},
                ],
                max_tokens=500,
                temperature=0.6,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception:
            logger.exception("OpenAI completion failed; falling back to stub")
            return StubProvider().complete(request)
