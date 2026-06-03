class AICompanionError(Exception):
    code = "AI_ERROR"

    def __init__(self, message: str, code: str | None = None):
        super().__init__(message)
        if code:
            self.code = code


class ValidationError(AICompanionError):
    code = "VALIDATION_ERROR"


class SafetyBlockedError(AICompanionError):
    code = "SAFETY_BLOCKED"


class ConversationNotFoundError(AICompanionError):
    code = "NOT_FOUND"
