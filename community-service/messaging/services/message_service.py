from uuid import UUID

from django.utils import timezone

from analytics.emitter import emit_event
from analytics.events import CommunityEvent, EVENT_MESSAGE_READ, EVENT_MESSAGE_SENT
from messaging.exceptions import PermissionDeniedError, ValidationError
from messaging.moderation.hooks import ModerationDecision, before_message_send
from messaging.models import ModerationStatus
from messaging.repositories import MessageRepository
from messaging.services.channel_service import ChannelService
from users.auth.base import AuthContext


class MessageService:
    def __init__(
        self,
        message_repo: MessageRepository | None = None,
        channel_service: ChannelService | None = None,
    ):
        self.message_repo = message_repo or MessageRepository()
        self.channel_service = channel_service or ChannelService()

    def send(
        self,
        auth: AuthContext,
        channel_id: UUID,
        *,
        body: str,
        metadata: dict | None = None,
    ):
        text = (body or "").strip()
        if not text:
            raise ValidationError("Message cannot be empty")
        if len(text) > 4000:
            raise ValidationError("Message is too long")

        channel, _member = self.channel_service._require_channel_member(
            auth, channel_id
        )

        decision = before_message_send(
            str(auth.user_id), str(channel_id), text, metadata or {}
        )
        if decision == ModerationDecision.BLOCK:
            raise PermissionDeniedError("Message blocked by moderation policy")

        status = (
            ModerationStatus.VISIBLE
            if decision == ModerationDecision.ALLOW
            else ModerationStatus.FLAGGED
        )

        message = self.message_repo.create(
            organization_id=auth.organization_id,
            channel_id=channel_id,
            sender_id=auth.user_id,
            body=text,
            metadata=metadata or {},
            moderation_status=status,
        )

        emit_event(
            CommunityEvent(
                event_type=EVENT_MESSAGE_SENT,
                domain="messaging",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "channel_id": str(channel_id),
                    "message_id": str(message.id),
                    "community_id": str(channel.community_id)
                    if channel.community_id
                    else None,
                },
            )
        )
        return message

    def list_history(
        self,
        auth: AuthContext,
        channel_id: UUID,
        *,
        cursor: UUID | None = None,
        limit: int = 50,
    ):
        self.channel_service._require_channel_member(auth, channel_id)
        limit = min(max(limit, 1), 100)
        messages = self.message_repo.list_for_channel(
            channel_id, before_id=cursor, limit=limit
        )
        next_cursor = str(messages[0].id) if len(messages) >= limit else None
        return messages, next_cursor

    def mark_read(
        self,
        auth: AuthContext,
        channel_id: UUID,
        *,
        message_id: UUID | None = None,
    ):
        member = self.channel_service.mark_read(
            auth, channel_id, read_at=timezone.now(), message_id=message_id
        )
        emit_event(
            CommunityEvent(
                event_type=EVENT_MESSAGE_READ,
                domain="messaging",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "channel_id": str(channel_id),
                    "message_id": str(message_id) if message_id else None,
                },
            )
        )
        return member

    def serialize_message(self, message) -> dict:
        return {
            "message_id": str(message.id),
            "sender_id": str(message.sender_id),
            "sender_name": message.sender.display_name or str(message.sender_id),
            "channel_id": str(message.channel_id),
            "message": message.body,
            "timestamp": message.created_at.isoformat().replace("+00:00", "Z"),
            "metadata": message.metadata,
            "moderation_status": message.moderation_status,
        }
