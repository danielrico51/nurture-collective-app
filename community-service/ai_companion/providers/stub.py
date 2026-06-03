from ai_companion.providers.base import AICompletionRequest, AIProvider


class StubProvider:
    """Deterministic responses for local dev and tests."""

    def complete(self, request: AICompletionRequest) -> str:
        user = (request.user_message or "").strip()
        if not user:
            return (
                "How are you feeling today? You can share a word, a mood, "
                "or anything that's on your mind."
            )
        if "?" in user:
            return (
                "Thank you for asking. Every journey is different — what you're "
                "feeling can be normal, and your care team is the best guide for "
                "medical questions. Would you like to note this in your wellness journal?"
            )
        return (
            "Thank you for sharing. I'm here to listen. "
            "If anything feels urgent, please reach out to your care team or emergency services."
        )
