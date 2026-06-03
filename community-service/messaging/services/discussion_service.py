from uuid import UUID

from communities.repositories import MembershipRepository
from messaging.exceptions import (
    ChannelNotFoundError,
    PermissionDeniedError,
    ValidationError,
)
from messaging.models import (
    CommunityPost,
    ModerationStatus,
    PostComment,
    REACTION_TYPES,
)
from messaging.moderation.hooks import ModerationDecision, before_message_send
from messaging.repositories import (
    CommentRepository,
    PostReactionRepository,
    PostRepository,
)
from users.auth.base import AuthContext
from users.services.profile_service import avatar_url_for_profile


class DiscussionService:
    def __init__(
        self,
        post_repo: PostRepository | None = None,
        comment_repo: CommentRepository | None = None,
        reaction_repo: PostReactionRepository | None = None,
        membership_repo: MembershipRepository | None = None,
    ):
        self.post_repo = post_repo or PostRepository()
        self.comment_repo = comment_repo or CommentRepository()
        self.reaction_repo = reaction_repo or PostReactionRepository()
        self.membership_repo = membership_repo or MembershipRepository()

    def _require_member(self, auth: AuthContext, community_id: UUID):
        membership = self.membership_repo.get_active(auth.user_id, community_id)
        if membership is None:
            raise PermissionDeniedError("Join the community to view or post")
        return membership

    def _moderate_text(self, auth: AuthContext, community_id: UUID, text: str) -> str:
        decision = before_message_send(
            str(auth.user_id), str(community_id), text, {}
        )
        if decision == ModerationDecision.BLOCK:
            raise PermissionDeniedError("Content blocked by moderation policy")
        return (
            ModerationStatus.VISIBLE
            if decision == ModerationDecision.ALLOW
            else ModerationStatus.FLAGGED
        )

    def list_posts(
        self,
        auth: AuthContext,
        community_id: UUID,
        *,
        env_scope: str,
        cursor: UUID | None = None,
        limit: int = 30,
    ):
        self._require_member(auth, community_id)
        limit = min(max(limit, 1), 50)
        posts = self.post_repo.list_for_community(
            community_id, env_scope=env_scope, limit=limit, cursor=cursor
        )
        self._attach_reactions(posts, auth.user_id)
        next_cursor = str(posts[-1].id) if len(posts) >= limit else None
        return posts, next_cursor

    def create_post(
        self,
        auth: AuthContext,
        community_id: UUID,
        *,
        env_scope: str,
        title: str = "",
        body: str,
        image_urls: list | None = None,
    ) -> CommunityPost:
        self._require_member(auth, community_id)
        text_body = (body or "").strip()
        urls = self._normalize_image_urls(image_urls)
        if not text_body and not urls:
            raise ValidationError("Add text or at least one photo")
        if len(text_body) > 8000:
            raise ValidationError("Post is too long")

        title_clean = (title or "").strip()[:300]
        moderate_blob = f"{title_clean}\n{text_body}\n" + "\n".join(urls)
        status = self._moderate_text(auth, community_id, moderate_blob)

        return self.post_repo.create(
            organization_id=auth.organization_id,
            community_id=community_id,
            author_id=auth.user_id,
            title=title_clean,
            body=text_body,
            image_urls=urls,
            moderation_status=status,
            env_scope=env_scope,
        )

    @staticmethod
    def _normalize_image_urls(image_urls: list | None) -> list[str]:
        if not image_urls:
            return []
        cleaned: list[str] = []
        for raw in image_urls:
            if not isinstance(raw, str):
                continue
            url = raw.strip()
            if not url or len(url) > 2000:
                continue
            if url in cleaned:
                continue
            cleaned.append(url)
            if len(cleaned) >= 4:
                break
        return cleaned

    def get_post(
        self,
        auth: AuthContext,
        community_id: UUID,
        post_id: UUID,
        *,
        env_scope: str,
    ) -> CommunityPost:
        self._require_member(auth, community_id)
        post = self.post_repo.get_by_id(
            post_id, community_id=community_id, env_scope=env_scope
        )
        if post is None:
            raise ChannelNotFoundError("Post not found")
        self._attach_reactions([post], auth.user_id)
        return post

    @staticmethod
    def _require_post_author(auth: AuthContext, post: CommunityPost) -> None:
        if str(post.author_id) != str(auth.user_id):
            raise PermissionDeniedError("You can only edit or delete your own posts")

    def update_post(
        self,
        auth: AuthContext,
        community_id: UUID,
        post_id: UUID,
        *,
        env_scope: str,
        title: str | None = None,
        body: str | None = None,
        image_urls: list | None = None,
    ) -> CommunityPost:
        post = self.get_post(auth, community_id, post_id, env_scope=env_scope)
        self._require_post_author(auth, post)

        title_clean = post.title if title is None else (title or "").strip()[:300]
        text_body = post.body if body is None else (body or "").strip()
        urls = (
            list(post.image_urls or [])
            if image_urls is None
            else self._normalize_image_urls(image_urls)
        )

        if not text_body and not urls:
            raise ValidationError("Add text or at least one photo")

        if len(text_body) > 8000:
            raise ValidationError("Post is too long")

        moderate_blob = f"{title_clean}\n{text_body}\n" + "\n".join(urls)
        status = self._moderate_text(auth, community_id, moderate_blob)

        post.title = title_clean
        post.body = text_body
        post.image_urls = urls
        post.moderation_status = status
        post.save(
            update_fields=[
                "title",
                "body",
                "image_urls",
                "moderation_status",
                "updated_at",
            ]
        )
        self._attach_reactions([post], auth.user_id)
        return post

    def delete_post(
        self,
        auth: AuthContext,
        community_id: UUID,
        post_id: UUID,
        *,
        env_scope: str,
    ) -> None:
        post = self.get_post(auth, community_id, post_id, env_scope=env_scope)
        self._require_post_author(auth, post)
        post.soft_delete()

    def set_post_reaction(
        self,
        auth: AuthContext,
        community_id: UUID,
        post_id: UUID,
        *,
        env_scope: str,
        reaction_type: str,
    ) -> dict:
        post = self.get_post(auth, community_id, post_id, env_scope=env_scope)
        rtype = (reaction_type or "").strip().lower()
        if rtype not in REACTION_TYPES:
            raise ValidationError(
                f"Invalid reaction. Use one of: {', '.join(REACTION_TYPES)}"
            )

        existing = self.reaction_repo.get_user_reaction(post.id, auth.user_id)
        if existing and existing.reaction_type == rtype:
            self.reaction_repo.remove_reaction(post.id, auth.user_id)
        else:
            self.reaction_repo.set_reaction(
                organization_id=auth.organization_id,
                post_id=post.id,
                user_id=auth.user_id,
                reaction_type=rtype,
            )

        return self._reaction_summary_for_post(post.id, auth.user_id)

    def remove_post_reaction(
        self,
        auth: AuthContext,
        community_id: UUID,
        post_id: UUID,
        *,
        env_scope: str,
    ) -> dict:
        post = self.get_post(auth, community_id, post_id, env_scope=env_scope)
        self.reaction_repo.remove_reaction(post.id, auth.user_id)
        return self._reaction_summary_for_post(post.id, auth.user_id)

    def _reaction_summary_for_post(self, post_id: UUID, user_id: UUID) -> dict:
        counts_map = self.reaction_repo.counts_for_posts([post_id])
        user_map = self.reaction_repo.user_reactions_for_posts([post_id], user_id)
        return self._build_reaction_payload(counts_map.get(post_id, {}), user_map.get(post_id))

    def _attach_reactions(self, posts: list[CommunityPost], user_id: UUID) -> None:
        if not posts:
            return
        post_ids = [p.id for p in posts]
        counts_map = self.reaction_repo.counts_for_posts(post_ids)
        user_map = self.reaction_repo.user_reactions_for_posts(post_ids, user_id)
        for post in posts:
            post.reactions_summary = self._build_reaction_payload(
                counts_map.get(post.id, {}),
                user_map.get(post.id),
            )

    @staticmethod
    def _build_reaction_payload(
        counts: dict[str, int], user_reaction: str | None
    ) -> dict:
        total = sum(counts.values())
        return {
            "total": total,
            "counts": counts,
            "user_reaction": user_reaction,
        }

    def list_comments(
        self,
        auth: AuthContext,
        community_id: UUID,
        post_id: UUID,
        *,
        env_scope: str,
    ) -> list[PostComment]:
        self.get_post(auth, community_id, post_id, env_scope=env_scope)
        return list(self.comment_repo.list_for_post(post_id))

    def create_comment(
        self,
        auth: AuthContext,
        community_id: UUID,
        post_id: UUID,
        *,
        env_scope: str,
        body: str,
        parent_id: UUID | None = None,
    ) -> PostComment:
        post = self.get_post(auth, community_id, post_id, env_scope=env_scope)
        text = (body or "").strip()
        if not text:
            raise ValidationError("Comment cannot be empty")
        if len(text) > 4000:
            raise ValidationError("Comment is too long")

        parent = None
        if parent_id:
            parent = self.comment_repo.get_by_id(parent_id)
            if parent is None or parent.post_id != post.id:
                raise ValidationError("Invalid parent comment")
            if parent.parent_id is not None:
                raise ValidationError("Replies can only be one level deep")

        status = self._moderate_text(auth, community_id, text)

        return self.comment_repo.create(
            organization_id=auth.organization_id,
            post_id=post.id,
            parent_id=parent.id if parent else None,
            author_id=auth.user_id,
            body=text,
            moderation_status=status,
        )

    @staticmethod
    def serialize_post(post: CommunityPost) -> dict:
        comment_count = getattr(post, "comment_count", None)
        if comment_count is None:
            comment_count = post.comments.filter(
                moderation_status=ModerationStatus.VISIBLE
            ).count()

        reactions = getattr(post, "reactions_summary", None) or {
            "total": 0,
            "counts": {},
            "user_reaction": None,
        }

        return {
            "post_id": str(post.id),
            "community_id": str(post.community_id),
            "author_id": str(post.author_id),
            "author_name": post.author.display_name or "Member",
            "author_avatar_url": avatar_url_for_profile(post.author),
            "title": post.title,
            "body": post.body,
            "image_urls": list(post.image_urls or []),
            "comment_count": comment_count,
            "reactions": reactions,
            "created_at": post.created_at.isoformat().replace("+00:00", "Z"),
        }

    @staticmethod
    def serialize_comment(comment: PostComment) -> dict:
        return {
            "comment_id": str(comment.id),
            "post_id": str(comment.post_id),
            "parent_id": str(comment.parent_id) if comment.parent_id else None,
            "author_id": str(comment.author_id),
            "author_name": comment.author.display_name or "Member",
            "author_avatar_url": avatar_url_for_profile(comment.author),
            "body": comment.body,
            "created_at": comment.created_at.isoformat().replace("+00:00", "Z"),
        }

    @staticmethod
    def build_comment_tree(comments: list[PostComment]) -> list[dict]:
        serialized = [DiscussionService.serialize_comment(c) for c in comments]
        by_id = {item["comment_id"]: {**item, "replies": []} for item in serialized}
        roots: list[dict] = []
        for item in by_id.values():
            parent_id = item["parent_id"]
            if parent_id and parent_id in by_id:
                by_id[parent_id]["replies"].append(item)
            else:
                roots.append(item)
        return roots
