from enum import Enum


class ModerationDecision(str, Enum):
    ALLOW = "allow"
    FLAG = "flag"
    BLOCK = "block"


def before_message_send(
    sender_id: str, channel_id: str, body: str, metadata: dict
) -> ModerationDecision:
    """Hook stub — implement moderation logic later."""
    return ModerationDecision.ALLOW


def content_review(message_id: str) -> ModerationDecision:
    """Hook stub — implement moderation logic later."""
    return ModerationDecision.ALLOW


def escalate_flagged_content(message_id: str, reason: str) -> None:
    """Hook stub — TODO: route to admin queue."""
