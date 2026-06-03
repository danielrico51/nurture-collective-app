from django.db import models

from users.models import Organization, UserProfile
from users.models_base import TimestampedSoftDeleteModel


class ConversationType(models.TextChoices):
    CHECKIN = "checkin", "Daily check-in"
    QA = "qa", "Q&A"
    RECOMMEND = "recommend", "Resource recommendations"


class MessageRole(models.TextChoices):
    SYSTEM = "system", "System"
    USER = "user", "User"
    ASSISTANT = "assistant", "Assistant"


class PromptVersion(TimestampedSoftDeleteModel):
    slug = models.CharField(max_length=64)
    version = models.PositiveIntegerField(default=1)
    template = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "ai_companion_promptversion"
        constraints = [
            models.UniqueConstraint(
                fields=["slug", "version"],
                name="ai_prompt_slug_version_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.slug} v{self.version}"


class Conversation(TimestampedSoftDeleteModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="ai_conversations",
        db_column="organization_id",
    )
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
        db_column="user_id",
    )
    conversation_type = models.CharField(
        max_length=16,
        choices=ConversationType.choices,
    )
    prompt_slug = models.CharField(max_length=64)
    prompt_version = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "ai_companion_conversation"
        indexes = [
            models.Index(fields=["user", "conversation_type"], name="ai_conv_user_type_idx"),
        ]


class ConversationMessage(TimestampedSoftDeleteModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="conversation_id",
    )
    role = models.CharField(max_length=16, choices=MessageRole.choices)
    body = models.TextField()

    class Meta:
        db_table = "ai_companion_message"
        indexes = [
            models.Index(fields=["conversation", "created_at"], name="ai_msg_conv_created_idx"),
        ]
