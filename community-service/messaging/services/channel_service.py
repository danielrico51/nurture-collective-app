from uuid import UUID

from django.utils import timezone

from communities.repositories import MembershipRepository
from messaging.exceptions import (
    ChannelNotFoundError,
    NotChannelMemberError,
    PermissionDeniedError,
    ValidationError,
)
from messaging.models import DEFAULT_COMMUNITY_CHANNEL_NAME, ChannelType
from messaging.repositories import ChannelMemberRepository, ChannelRepository
from users.auth.base import AuthContext


def _participant_hash(user_a: UUID, user_b: UUID) -> str:
    return ":".join(sorted((str(user_a), str(user_b))))


class ChannelService:
    def __init__(
        self,
        channel_repo: ChannelRepository | None = None,
        member_repo: ChannelMemberRepository | None = None,
        membership_repo: MembershipRepository | None = None,
    ):
        self.channel_repo = channel_repo or ChannelRepository()
        self.member_repo = member_repo or ChannelMemberRepository()
        self.membership_repo = membership_repo or MembershipRepository()

    def _require_channel_member(self, auth: AuthContext, channel_id: UUID):
        channel = self.channel_repo.get_by_id(
            channel_id, organization_id=auth.organization_id
        )
        if channel is None:
            raise ChannelNotFoundError("Channel not found")

        member = self.member_repo.get(channel_id, auth.user_id)
        if member is None:
            raise NotChannelMemberError("Not a member of this channel")
        return channel, member

    def get_or_create_default_community_channel(
        self, auth: AuthContext, community_id: UUID
    ):
        community_membership = self.membership_repo.get_active(
            auth.user_id, community_id
        )
        if community_membership is None:
            raise PermissionDeniedError("Join the community before opening discussions")

        channel = self.channel_repo.get_default_for_community(community_id)
        if channel is None:
            channel = self.channel_repo.create(
                organization_id=auth.organization_id,
                community_id=community_id,
                channel_type=ChannelType.GROUP,
                name=DEFAULT_COMMUNITY_CHANNEL_NAME,
                metadata={"is_default": True},
            )

        self.member_repo.add_member(
            channel_id=channel.id,
            user_id=auth.user_id,
            joined_at=timezone.now(),
        )
        return channel

    def ensure_community_channel_membership(self, user_id: UUID, community_id: UUID):
        """Called when a user joins a community."""
        channel = self.channel_repo.get_default_for_community(community_id)
        if channel is None:
            return None
        return self.member_repo.add_member(
            channel_id=channel.id,
            user_id=user_id,
            joined_at=timezone.now(),
        )

    def create_default_channel_for_community(
        self, *, organization_id: UUID, community_id: UUID
    ):
        existing = self.channel_repo.get_default_for_community(community_id)
        if existing:
            return existing
        return self.channel_repo.create(
            organization_id=organization_id,
            community_id=community_id,
            channel_type=ChannelType.GROUP,
            name=DEFAULT_COMMUNITY_CHANNEL_NAME,
            metadata={"is_default": True},
        )

    def list_for_user(
        self, auth: AuthContext, *, community_id: UUID | None = None
    ) -> list:
        if community_id:
            self.get_or_create_default_community_channel(auth, community_id)

        channels = self.channel_repo.list_for_user(
            auth.user_id, community_id=community_id
        )
        return list(channels)

    def create_group(
        self,
        auth: AuthContext,
        *,
        community_id: UUID,
        name: str,
    ):
        membership = self.membership_repo.get_active(auth.user_id, community_id)
        if membership is None:
            raise PermissionDeniedError("Must be a community member")

        channel = self.channel_repo.create(
            organization_id=auth.organization_id,
            community_id=community_id,
            channel_type=ChannelType.GROUP,
            name=name.strip() or DEFAULT_COMMUNITY_CHANNEL_NAME,
            metadata={},
        )
        self.member_repo.add_member(
            channel_id=channel.id,
            user_id=auth.user_id,
            joined_at=timezone.now(),
        )
        return channel

    def create_direct(self, auth: AuthContext, *, participant_id: UUID):
        if participant_id == auth.user_id:
            raise ValidationError("Cannot create a direct message with yourself")

        phash = _participant_hash(auth.user_id, participant_id)
        existing = self.channel_repo.get_direct_by_participant_hash(
            auth.organization_id, phash
        )
        if existing:
            self.member_repo.add_member(
                channel_id=existing.id,
                user_id=auth.user_id,
                joined_at=timezone.now(),
            )
            self.member_repo.add_member(
                channel_id=existing.id,
                user_id=participant_id,
                joined_at=timezone.now(),
            )
            return existing

        channel = self.channel_repo.create(
            organization_id=auth.organization_id,
            community_id=None,
            channel_type=ChannelType.DIRECT,
            name="Direct message",
            metadata={
                "participant_hash": phash,
                "participants": [str(auth.user_id), str(participant_id)],
            },
        )
        now = timezone.now()
        for uid in (auth.user_id, participant_id):
            self.member_repo.add_member(
                channel_id=channel.id, user_id=uid, joined_at=now
            )
        return channel

    def mark_read(
        self,
        auth: AuthContext,
        channel_id: UUID,
        *,
        read_at=None,
        message_id: UUID | None = None,
    ):
        _channel, member = self._require_channel_member(auth, channel_id)
        member.last_read_at = read_at or timezone.now()
        self.member_repo.save(member)
        return member
