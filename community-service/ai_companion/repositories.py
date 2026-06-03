from uuid import UUID

from ai_companion.models import Conversation, ConversationMessage, ConversationType, MessageRole, PromptVersion
from users.models import Organization, UserProfile


class PromptRepository:
    def get_active(self, slug: str) -> PromptVersion | None:
        return (
            PromptVersion.objects.filter(slug=slug, is_active=True)
            .order_by("-version")
            .first()
        )


class ConversationRepository:
    def create(
        self,
        *,
        organization: Organization,
        user: UserProfile,
        conversation_type: str,
        prompt_slug: str,
        prompt_version: int,
    ) -> Conversation:
        return Conversation.objects.create(
            organization=organization,
            user=user,
            conversation_type=conversation_type,
            prompt_slug=prompt_slug,
            prompt_version=prompt_version,
        )

    def get_for_user(self, conversation_id: UUID, user_id: UUID) -> Conversation | None:
        return Conversation.objects.filter(id=conversation_id, user_id=user_id).first()

    def add_message(
        self,
        conversation: Conversation,
        *,
        role: str,
        body: str,
    ) -> ConversationMessage:
        return ConversationMessage.objects.create(
            conversation=conversation,
            role=role,
            body=body,
        )
