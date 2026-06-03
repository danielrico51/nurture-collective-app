import uuid

from django.db import models

from communities.models import Community
from users.models import Organization, UserProfile
from users.models_base import TimestampedSoftDeleteModel


class ChannelType(models.TextChoices):
    GROUP = "group", "Group"
    DIRECT = "direct", "Direct"
    ANNOUNCEMENT = "announcement", "Announcement"


class ModerationStatus(models.TextChoices):
    VISIBLE = "visible", "Visible"
    FLAGGED = "flagged", "Flagged"
    REMOVED = "removed", "Removed"


DEFAULT_COMMUNITY_CHANNEL_NAME = "General"


class Channel(TimestampedSoftDeleteModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="channels",
        db_column="organization_id",
    )
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="channels",
        db_column="community_id",
    )
    channel_type = models.CharField(max_length=16, choices=ChannelType.choices)
    name = models.CharField(max_length=200)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "messaging_channel"
        indexes = [
            models.Index(fields=["organization"], name="channel_org_idx"),
            models.Index(
                fields=["community"],
                name="channel_community_idx",
                condition=models.Q(community_id__isnull=False),
            ),
            models.Index(
                fields=["organization", "channel_type"],
                name="channel_org_type_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class ChannelMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="members",
        db_column="channel_id",
    )
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="channel_memberships",
        db_column="user_id",
    )
    last_read_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField()

    class Meta:
        db_table = "messaging_channelmember"
        constraints = [
            models.UniqueConstraint(
                fields=["channel", "user"],
                name="channel_member_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "channel"], name="channel_member_user_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} in {self.channel_id}"


class Message(TimestampedSoftDeleteModel):
    """Legacy chat messages (DM / realtime channels). Community feed uses Post + Comment."""

    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="messages",
        db_column="organization_id",
    )
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="channel_id",
    )
    sender = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="sent_messages",
        db_column="sender_id",
    )
    body = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    moderation_status = models.CharField(
        max_length=16,
        choices=ModerationStatus.choices,
        default=ModerationStatus.VISIBLE,
    )
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "messaging_message"
        indexes = [
            models.Index(
                fields=["channel", "-created_at"],
                name="message_channel_created_idx",
            ),
            models.Index(
                fields=["sender", "-created_at"],
                name="message_sender_created_idx",
            ),
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Message {self.id}"


class CommunityPost(TimestampedSoftDeleteModel):
    """Facebook / Reddit-style post in a community feed."""

    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="community_posts",
        db_column="organization_id",
    )
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name="posts",
        db_column="community_id",
    )
    author = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="community_posts",
        db_column="author_id",
    )
    title = models.CharField(max_length=300, blank=True, default="")
    body = models.TextField(blank=True, default="")
    image_urls = models.JSONField(default=list, blank=True)
    moderation_status = models.CharField(
        max_length=16,
        choices=ModerationStatus.choices,
        default=ModerationStatus.VISIBLE,
    )
    env_scope = models.CharField(
        max_length=32,
        default="production",
        db_index=True,
        help_text="Deployment scope (dev/staging/production) so branch previews do not mix feeds.",
    )

    class Meta:
        db_table = "messaging_communitypost"
        indexes = [
            models.Index(
                fields=["community", "env_scope", "-created_at"],
                name="post_comm_env_created_idx",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title or self.body[:40]


class PostComment(TimestampedSoftDeleteModel):
    """Comment on a post; optional parent for one level of reply threading."""

    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="post_comments",
        db_column="organization_id",
    )
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="comments",
        db_column="post_id",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        db_column="parent_id",
    )
    author = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="post_comments",
        db_column="author_id",
    )
    body = models.TextField()
    moderation_status = models.CharField(
        max_length=16,
        choices=ModerationStatus.choices,
        default=ModerationStatus.VISIBLE,
    )

    class Meta:
        db_table = "messaging_postcomment"
        indexes = [
            models.Index(
                fields=["post", "created_at"],
                name="comment_post_created_idx",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return self.body[:40]


class ReactionType(models.TextChoices):
    LIKE = "like", "Like"
    LOVE = "love", "Love"
    CARE = "care", "Care"
    HAHA = "haha", "Haha"
    WOW = "wow", "Wow"
    SAD = "sad", "Sad"
    ANGRY = "angry", "Angry"


REACTION_TYPES = tuple(value for value, _label in ReactionType.choices)


class PostReaction(models.Model):
    """One reaction per member per post (Facebook-style)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="post_reactions",
        db_column="organization_id",
    )
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="reactions",
        db_column="post_id",
    )
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="post_reactions",
        db_column="user_id",
    )
    reaction_type = models.CharField(max_length=16, choices=ReactionType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "messaging_postreaction"
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user"],
                name="post_reaction_user_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["post", "reaction_type"], name="post_reaction_post_type_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.reaction_type} on {self.post_id}"
