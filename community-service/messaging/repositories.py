from uuid import UUID

from django.db.models import Count, Max, Q, QuerySet

from messaging.models import (
    DEFAULT_COMMUNITY_CHANNEL_NAME,
    Channel,
    ChannelMember,
    ChannelType,
    CommunityPost,
    Message,
    ModerationStatus,
    PostComment,
    PostReaction,
    REACTION_TYPES,
)


class ChannelRepository:
    def create(self, **kwargs) -> Channel:
        return Channel.objects.create(**kwargs)

    def get_by_id(
        self, channel_id: UUID, organization_id: UUID | None = None
    ) -> Channel | None:
        qs = Channel.objects.filter(id=channel_id)
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        return qs.first()

    def get_default_for_community(self, community_id: UUID) -> Channel | None:
        return Channel.objects.filter(
            community_id=community_id,
            channel_type=ChannelType.GROUP,
            name=DEFAULT_COMMUNITY_CHANNEL_NAME,
            metadata__is_default=True,
        ).first()

    def get_direct_by_participant_hash(
        self, organization_id: UUID, participant_hash: str
    ) -> Channel | None:
        return Channel.objects.filter(
            organization_id=organization_id,
            channel_type=ChannelType.DIRECT,
            metadata__participant_hash=participant_hash,
        ).first()

    def list_for_user(
        self, user_id: UUID, *, community_id: UUID | None = None
    ) -> QuerySet[Channel]:
        qs = Channel.objects.filter(
            members__user_id=user_id,
        ).distinct()
        if community_id:
            qs = qs.filter(community_id=community_id)
        return qs.order_by("-created_at")


class ChannelMemberRepository:
    def get(self, channel_id: UUID, user_id: UUID) -> ChannelMember | None:
        return ChannelMember.objects.filter(
            channel_id=channel_id, user_id=user_id
        ).first()

    def add_member(self, *, channel_id: UUID, user_id: UUID, joined_at) -> ChannelMember:
        member, _created = ChannelMember.objects.get_or_create(
            channel_id=channel_id,
            user_id=user_id,
            defaults={"joined_at": joined_at},
        )
        return member

    def save(self, member: ChannelMember) -> ChannelMember:
        member.save()
        return member


class MessageRepository:
    def create(self, **kwargs) -> Message:
        return Message.objects.create(**kwargs)

    def list_for_channel(
        self,
        channel_id: UUID,
        *,
        before_id: UUID | None = None,
        limit: int = 50,
    ) -> list[Message]:
        qs = Message.objects.filter(
            channel_id=channel_id,
            moderation_status="visible",
        ).select_related("sender").order_by("-created_at")

        if before_id:
            anchor = Message.objects.filter(id=before_id).first()
            if anchor:
                qs = qs.filter(created_at__lt=anchor.created_at)

        return list(qs[:limit][::-1])

    def get_last_message_at(self, channel_id: UUID):
        return (
            Message.objects.filter(channel_id=channel_id)
            .aggregate(last_at=Max("created_at"))
            .get("last_at")
        )

    def count_unread(
        self, channel_id: UUID, user_id: UUID, last_read_at
    ) -> int:
        qs = Message.objects.filter(channel_id=channel_id).exclude(sender_id=user_id)
        if last_read_at:
            qs = qs.filter(created_at__gt=last_read_at)
        return qs.count()


class PostRepository:
    def create(self, **kwargs) -> CommunityPost:
        return CommunityPost.objects.create(**kwargs)

    def get_by_id(
        self,
        post_id: UUID,
        *,
        community_id: UUID | None = None,
        env_scope: str | None = None,
    ) -> CommunityPost | None:
        qs = CommunityPost.objects.filter(id=post_id).select_related("author")
        if community_id:
            qs = qs.filter(community_id=community_id)
        if env_scope:
            qs = qs.filter(env_scope=env_scope)
        return qs.first()

    def list_for_community(
        self,
        community_id: UUID,
        *,
        env_scope: str,
        limit: int = 30,
        cursor: UUID | None = None,
    ) -> list[CommunityPost]:
        qs = (
            CommunityPost.objects.filter(
                community_id=community_id,
                env_scope=env_scope,
                moderation_status=ModerationStatus.VISIBLE,
            )
            .select_related("author")
            .annotate(comment_count=Count("comments"))
            .order_by("-created_at")
        )
        if cursor:
            anchor = CommunityPost.objects.filter(id=cursor).first()
            if anchor:
                qs = qs.filter(created_at__lt=anchor.created_at)
        return list(qs[:limit])


class CommentRepository:
    def create(self, **kwargs) -> PostComment:
        return PostComment.objects.create(**kwargs)

    def get_by_id(self, comment_id: UUID) -> PostComment | None:
        return PostComment.objects.filter(id=comment_id).select_related("author").first()

    def list_for_post(self, post_id: UUID) -> QuerySet[PostComment]:
        return PostComment.objects.filter(
            post_id=post_id,
            moderation_status=ModerationStatus.VISIBLE,
        ).select_related("author").order_by("created_at")


class PostReactionRepository:
    def set_reaction(
        self,
        *,
        organization_id: UUID,
        post_id: UUID,
        user_id: UUID,
        reaction_type: str,
    ) -> PostReaction:
        reaction, _created = PostReaction.objects.update_or_create(
            post_id=post_id,
            user_id=user_id,
            defaults={
                "organization_id": organization_id,
                "reaction_type": reaction_type,
            },
        )
        return reaction

    def remove_reaction(self, post_id: UUID, user_id: UUID) -> bool:
        deleted, _ = PostReaction.objects.filter(
            post_id=post_id, user_id=user_id
        ).delete()
        return deleted > 0

    def get_user_reaction(self, post_id: UUID, user_id: UUID) -> PostReaction | None:
        return PostReaction.objects.filter(post_id=post_id, user_id=user_id).first()

    def counts_for_posts(self, post_ids: list[UUID]) -> dict[UUID, dict[str, int]]:
        if not post_ids:
            return {}
        rows = (
            PostReaction.objects.filter(post_id__in=post_ids)
            .values("post_id", "reaction_type")
            .annotate(count=Count("id"))
        )
        result: dict[UUID, dict[str, int]] = {pid: {} for pid in post_ids}
        for row in rows:
            pid = row["post_id"]
            rtype = row["reaction_type"]
            if rtype in REACTION_TYPES:
                result[pid][rtype] = row["count"]
        return result

    def user_reactions_for_posts(
        self, post_ids: list[UUID], user_id: UUID
    ) -> dict[UUID, str]:
        if not post_ids:
            return {}
        rows = PostReaction.objects.filter(
            post_id__in=post_ids, user_id=user_id
        ).values("post_id", "reaction_type")
        return {row["post_id"]: row["reaction_type"] for row in rows}
