class MessagingError(Exception):
    code = "MESSAGING_ERROR"


class FeatureDisabledError(MessagingError):
    code = "FEATURE_DISABLED"


class ChannelNotFoundError(MessagingError):
    code = "NOT_FOUND"


class NotChannelMemberError(MessagingError):
    code = "NOT_CHANNEL_MEMBER"


class PermissionDeniedError(MessagingError):
    code = "PERMISSION_DENIED"


class ValidationError(MessagingError):
    code = "VALIDATION_ERROR"
