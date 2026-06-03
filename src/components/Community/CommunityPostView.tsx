"use client";

import { AuthorAvatar } from "@/components/Community/AuthorAvatar";
import { formatPostTime } from "@/components/Community/discussionHelpers";
import { PostImages } from "@/components/Community/PostImages";
import { PostOwnerMenu } from "@/components/Community/PostOwnerMenu";
import { PostReactionsControlled } from "@/components/Community/PostReactions";
import {
  createPostComment,
  fetchCommunityPost,
  fetchPostComments,
  withDefaultReactions,
  type CommunityPost,
  type PostComment,
} from "@/lib/api/communityDiscussionApi";
import { isCommunityConnectionError } from "@/lib/api/communityApiError";
import {
  getDemoPostById,
  getDemoPostComments,
} from "@/lib/community/demoData";
import { isCommunityDemoMode } from "@/lib/community/client";
import { communityDetailPath } from "@/lib/community/paths";
import Link from "next/link";
import { fetchMemberProfile } from "@/lib/account/profileAvatarClient";
import { useCallback, useEffect, useState } from "react";

interface CommunityPostViewProps {
  communityId: string;
  postId: string;
}

function CommentBlock({
  comment,
  communityId,
  postId,
  onReply,
  depth = 0,
}: {
  comment: PostComment;
  communityId: string;
  postId: string;
  onReply: (parentId: string) => void;
  depth?: number;
}) {
  const canReply = depth === 0;

  return (
    <div className={depth > 0 ? "ml-10 mt-3" : "mt-4"}>
      <div className="flex gap-3">
        <AuthorAvatar
          name={comment.author_name}
          imageUrl={comment.author_avatar_url}
          size="sm"
        />
        <div className="min-w-0 flex-1 rounded-2xl bg-nurture-cream/50 px-3 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-nurture-charcoal">
              {comment.author_name}
            </span>
            <span className="text-[10px] text-nurture-charcoal/45">
              {formatPostTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-nurture-charcoal/85">
            {comment.body}
          </p>
          {canReply ? (
            <button
              type="button"
              onClick={() => onReply(comment.comment_id)}
              className="mt-2 text-xs font-medium text-nurture-sage-dark hover:underline"
            >
              Reply
            </button>
          ) : null}
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentBlock
          key={reply.comment_id}
          comment={reply}
          communityId={communityId}
          postId={postId}
          onReply={onReply}
          depth={1}
        />
      ))}
    </div>
  );
}

export function CommunityPostView({ communityId, postId }: CommunityPostViewProps) {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (usingDemo) return;
    fetchMemberProfile()
      .then((p) => setMyUserId(p.user_id))
      .catch(() => undefined);
  }, [usingDemo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isCommunityDemoMode()) {
        const demoPost = getDemoPostById(communityId, postId);
        if (!demoPost) {
          setError("Post not found");
          setPost(null);
          return;
        }
        setPost(demoPost);
        setComments(getDemoPostComments(communityId, postId));
        setUsingDemo(true);
        return;
      }

      const [postData, commentData] = await Promise.all([
        fetchCommunityPost(communityId, postId),
        fetchPostComments(communityId, postId),
      ]);
      setPost(withDefaultReactions(postData));
      setComments(commentData.comments);
      setUsingDemo(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load post");
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [communityId, postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || submitting || !post) return;

    setSubmitting(true);
    setError(null);
    try {
      if (usingDemo) {
        const newComment: PostComment = {
          comment_id: `demo-comment-${Date.now()}`,
          post_id: postId,
          parent_id: replyToId,
          author_id: "demo-user",
          author_name: "You",
          body: text,
          created_at: new Date().toISOString(),
          replies: [],
        };
        if (replyToId) {
          setComments((prev) =>
            prev.map((c) =>
              c.comment_id === replyToId
                ? {
                    ...c,
                    replies: [...(c.replies ?? []), newComment],
                  }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, newComment]);
        }
        setBody("");
        setReplyToId(null);
        return;
      }

      await createPostComment(communityId, postId, {
        body: text,
        parent_id: replyToId ?? undefined,
      });
      setBody("");
      setReplyToId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <p className="text-sm text-nurture-charcoal/60">Loading post…</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error ?? "Post not found"}</p>
        {error && isCommunityConnectionError(error) ? (
          <p className="mt-2 text-xs text-red-700">
            Start community-service on port 8001 and restart Next.js.
          </p>
        ) : null}
        {error ? (
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 text-sm font-medium text-red-900 underline"
          >
            Retry
          </button>
        ) : null}
        <Link
          href={communityDetailPath(communityId)}
          className="mt-4 inline-block text-sm font-medium text-nurture-sage-dark hover:underline"
        >
          Back to community
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={communityDetailPath(communityId)}
        className="text-sm font-medium text-nurture-sage-dark hover:underline"
      >
        ← Back to feed
      </Link>

      {usingDemo ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Preview mode.</strong> Sample comments only.
        </p>
      ) : null}

      <article className="mt-6 rounded-2xl border border-nurture-sage/20 bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <AuthorAvatar
            name={post.author_name}
            imageUrl={post.author_avatar_url}
          />
          <div>
            <p className="font-medium text-nurture-charcoal">{post.author_name}</p>
            <p className="text-xs text-nurture-charcoal/45">
              {formatPostTime(post.created_at)}
            </p>
          </div>
        </div>
        {post.title ? (
          <h1 className="mt-4 font-serif text-xl font-semibold text-nurture-charcoal">
            {post.title}
          </h1>
        ) : null}
        {post.body ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-nurture-charcoal/85">
            {post.body}
          </p>
        ) : null}
        <PostImages urls={post.image_urls ?? []} />
        <PostReactionsControlled
          post={post}
          communityId={communityId}
          demoMode={usingDemo}
          onPostUpdate={setPost}
        />
        <PostOwnerMenu
          communityId={communityId}
          post={post}
          myUserId={myUserId}
          demoMode={usingDemo}
          variant="full"
          onUpdated={(updated) => setPost(withDefaultReactions(updated))}
        />
      </article>

      <section className="mt-8">
        <h2 className="font-serif text-base font-semibold text-nurture-charcoal">
          Comments
        </h2>

        {comments.length === 0 ? (
          <p className="mt-3 text-sm text-nurture-charcoal/60">
            No comments yet. Be the first to reply.
          </p>
        ) : (
          <div>
            {comments.map((comment) => (
              <CommentBlock
                key={comment.comment_id}
                comment={comment}
                communityId={communityId}
                postId={postId}
                onReply={(id) => {
                  setReplyToId(id);
                  setBody("");
                }}
              />
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-nurture-sage/20 bg-white p-4 shadow-sm"
        >
          {replyToId ? (
            <p className="mb-2 text-xs text-nurture-charcoal/60">
              Replying to a comment.{" "}
              <button
                type="button"
                className="font-medium text-nurture-sage-dark hover:underline"
                onClick={() => setReplyToId(null)}
              >
                Cancel
              </button>
            </p>
          ) : null}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={replyToId ? "Write a reply…" : "Write a comment…"}
            rows={2}
            maxLength={4000}
            className="w-full resize-y rounded-lg border border-nurture-sage/15 px-3 py-2.5 text-sm outline-none focus:border-nurture-sage"
          />
          {error ? (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-full bg-nurture-sage px-5 py-2 text-sm font-medium text-white hover:bg-nurture-sage-dark disabled:opacity-50"
            >
              {submitting ? "Posting…" : replyToId ? "Reply" : "Comment"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
