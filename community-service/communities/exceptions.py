"""Domain exceptions for communities."""


class CommunityError(Exception):
    code = "COMMUNITY_ERROR"


class CommunityNotFoundError(CommunityError):
    code = "NOT_FOUND"


class PermissionDeniedError(CommunityError):
    code = "PERMISSION_DENIED"


class AlreadyMemberError(CommunityError):
    code = "ALREADY_MEMBER"


class NotMemberError(CommunityError):
    code = "NOT_MEMBER"


class FeatureDisabledError(CommunityError):
    code = "FEATURE_DISABLED"
