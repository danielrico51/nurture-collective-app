from uuid import UUID, uuid4

from analytics.emitter import emit_event
from analytics.events import CommunityEvent, EVENT_AI_QUESTION_ASKED
from ai_companion.exceptions import (
    ConversationNotFoundError,
    SafetyBlockedError,
    ValidationError,
)
from ai_companion.models import ConversationType, MessageRole
from ai_companion.providers import get_ai_provider
from ai_companion.providers.base import AICompletionRequest
from ai_companion.repositories import ConversationRepository, PromptRepository
from ai_companion.safety.middleware import SafetyMiddleware
from users.auth.base import AuthContext
from users.services.profile_service import get_profile


class CompanionService:
    def __init__(
        self,
        *,
        prompt_repo: PromptRepository | None = None,
        conversation_repo: ConversationRepository | None = None,
        provider=None,
    ):
        self.prompt_repo = prompt_repo or PromptRepository()
        self.conversation_repo = conversation_repo or ConversationRepository()
        self.provider = provider or get_ai_provider()

    def _require_prompt(self, slug: str):
        prompt = self.prompt_repo.get_active(slug)
        if prompt is None:
            raise ValidationError(f"Prompt {slug} is not configured")
        return prompt

    def _get_or_create_conversation(
        self,
        auth: AuthContext,
        *,
        conversation_id: UUID | None,
        conversation_type: str,
        prompt_slug: str,
        prompt_version: int,
    ):
        profile = get_profile(auth)
        if conversation_id:
            conversation = self.conversation_repo.get_for_user(
                conversation_id, auth.user_id
            )
            if conversation is None:
                raise ConversationNotFoundError("Conversation not found")
            return conversation, profile

        return (
            self.conversation_repo.create(
                organization=profile.organization,
                user=profile,
                conversation_type=conversation_type,
                prompt_slug=prompt_slug,
                prompt_version=prompt_version,
            ),
            profile,
        )

    def _emit_question(self, auth: AuthContext, *, conversation_id: UUID, question: str):
        emit_event(
            CommunityEvent(
                event_type=EVENT_AI_QUESTION_ASKED,
                domain="analytics",
                organization_id=str(auth.organization_id),
                user_id=str(auth.user_id),
                properties={
                    "conversation_id": str(conversation_id),
                    "question_preview": question[:200],
                },
            )
        )

    def daily_checkin(self, auth: AuthContext) -> dict:
        prompt = self._require_prompt("daily_checkin_v1")
        conversation, _profile = self._get_or_create_conversation(
            auth,
            conversation_id=None,
            conversation_type=ConversationType.CHECKIN,
            prompt_slug=prompt.slug,
            prompt_version=prompt.version,
        )
        message = self.provider.complete(
            AICompletionRequest(system_prompt=prompt.template, user_message="")
        )
        safe, escalation = SafetyMiddleware.post(message)
        if not safe:
            message = (
                "I'm having trouble responding right now. "
                "Please reach out to your care team if you need support."
            )
            escalation = True

        self.conversation_repo.add_message(
            conversation, role=MessageRole.ASSISTANT, body=message
        )
        return {
            "conversation_id": str(conversation.id),
            "prompt_version": f"{prompt.slug}_v{prompt.version}",
            "message": message,
            "safety_passed": True,
            "escalation_recommended": escalation,
        }

    def ask_question(
        self,
        auth: AuthContext,
        *,
        question: str,
        conversation_id: UUID | None = None,
    ) -> dict:
        text = (question or "").strip()
        if not text:
            raise ValidationError("question is required")
        if len(text) > 4000:
            raise ValidationError("question is too long")

        allowed, reason = SafetyMiddleware.pre(text)
        if not allowed:
            raise SafetyBlockedError("Message blocked by safety policy")

        prompt = self._require_prompt("qa_v1")
        conversation, _profile = self._get_or_create_conversation(
            auth,
            conversation_id=conversation_id,
            conversation_type=ConversationType.QA,
            prompt_slug=prompt.slug,
            prompt_version=prompt.version,
        )

        self.conversation_repo.add_message(
            conversation, role=MessageRole.USER, body=text
        )
        self._emit_question(auth, conversation_id=conversation.id, question=text)

        reply = self.provider.complete(
            AICompletionRequest(system_prompt=prompt.template, user_message=text)
        )
        safe, escalation = SafetyMiddleware.post(reply)
        if not safe:
            reply = (
                "I want to make sure you get the right support. "
                "Please contact your care team or emergency services if this feels urgent."
            )
            escalation = True

        self.conversation_repo.add_message(
            conversation, role=MessageRole.ASSISTANT, body=reply
        )
        return {
            "conversation_id": str(conversation.id),
            "message": reply,
            "safety_passed": allowed,
            "escalation_recommended": escalation,
        }

    def recommend_resources(
        self,
        auth: AuthContext,
        *,
        topic: str,
        conversation_id: UUID | None = None,
    ) -> dict:
        text = (topic or "").strip()
        if not text:
            raise ValidationError("topic is required")

        allowed, _reason = SafetyMiddleware.pre(text)
        if not allowed:
            raise SafetyBlockedError("Message blocked by safety policy")

        prompt = self._require_prompt("recommend_v1")
        conversation, _profile = self._get_or_create_conversation(
            auth,
            conversation_id=conversation_id,
            conversation_type=ConversationType.RECOMMEND,
            prompt_slug=prompt.slug,
            prompt_version=prompt.version,
        )

        user_message = f"Topic: {text}"
        self.conversation_repo.add_message(
            conversation, role=MessageRole.USER, body=user_message
        )
        self._emit_question(auth, conversation_id=conversation.id, question=text)

        reply = self.provider.complete(
            AICompletionRequest(system_prompt=prompt.template, user_message=user_message)
        )
        safe, escalation = SafetyMiddleware.post(reply)
        if not safe:
            reply = "Here are general Nurture Collective resources — ask your coordinator for personalized picks."
            escalation = False

        self.conversation_repo.add_message(
            conversation, role=MessageRole.ASSISTANT, body=reply
        )
        return {
            "conversation_id": str(conversation.id),
            "message": reply,
            "resources": _parse_resource_lines(reply),
            "safety_passed": allowed,
            "escalation_recommended": escalation,
        }

    def escalate_to_human(
        self,
        auth: AuthContext,
        *,
        conversation_id: UUID | None = None,
        reason: str = "",
        urgency: str = "normal",
    ) -> dict:
        text = (reason or "").strip() or "Member requested human follow-up"
        conversation = None
        if conversation_id:
            conversation = self.conversation_repo.get_for_user(
                conversation_id, auth.user_id
            )
            if conversation is None:
                raise ConversationNotFoundError("Conversation not found")

        escalation_id = str(uuid4())
        return {
            "escalation_id": escalation_id,
            "status": "queued",
            "message": "A care coordinator will follow up.",
            "conversation_id": str(conversation.id) if conversation else None,
            "urgency": urgency,
            "reason": text[:500],
        }


def _parse_resource_lines(message: str) -> list[dict]:
    lines = [line.strip() for line in message.splitlines() if line.strip()]
    resources = []
    for line in lines[:8]:
        resources.append({"title": line[:200], "url": None})
    if not resources and message.strip():
        resources.append({"title": message.strip()[:200], "url": None})
    return resources
