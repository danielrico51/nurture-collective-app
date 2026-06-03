import re

BLOCKED_PATTERNS = (
    r"\b(kill myself|suicide|end my life|want to die)\b",
    r"\b(hurt my baby|harm the baby)\b",
)

ESCALATION_PATTERNS = (
    r"\b(can\'?t breathe|chest pain|severe bleeding|unconscious)\b",
    r"\b(emergency|911|urgent help)\b",
)


class SafetyMiddleware:
    @staticmethod
    def pre(user_text: str) -> tuple[bool, str | None]:
        text = (user_text or "").strip().lower()
        if not text:
            return True, None
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return False, "safety_block"
        return True, None

    @staticmethod
    def post(assistant_text: str) -> tuple[bool, bool]:
        text = (assistant_text or "").strip()
        if not text:
            return False, False
        escalation = any(
            re.search(pattern, text, re.IGNORECASE) for pattern in ESCALATION_PATTERNS
        )
        return True, escalation
