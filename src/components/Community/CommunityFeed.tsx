"use client";

import { AuthorAvatar } from "@/components/Community/AuthorAvatar";
import {
  excerptBody,
  formatPostTime,
} from "@/components/Community/discussionHelpers";
import { PostComposer } from "@/components/Community/PostComposer";
import { PostImages } from "@/components/Community/PostImages";
import { PostOwnerMenu } from "@/components/Community/PostOwnerMenu";
import { PostReactionsControlled } from "@/components/Community/PostReactions";
import {
  createCommunityPost,
  fetchCommunityPosts,
  withDefaultReactions,
  type CommunityPost,
} from "@/lib/api/communityDiscussionApi";
import { runWithAutoRetry } from "@/lib/api/fetchWithRetry";
import { isCommunityConnectionError } from "@/lib/api/communityApiError";
import { getDemoPostsForCommunity } from "@/lib/community/demoData";
import { communityPostPath } from "@/lib/community/paths";
import Link from "next/link";
import { fetchMemberProfile } from "@/lib/account/profileAvatarClient";
import { useCallback, useEffect, useState } from "react";

interface CommunityFeedProps {
  communityId: string;
  isMember: boolean;
  demoMode?: boolean;
}

function PostCard({
  communityId,
  post,
  demoMode,
  myUserId,
  onPostUpdate,
  onPostDeleted,
}: {
  communityId: string;
  post: CommunityPost;
  demoMode: boolean;
  myUserId: string | null;
  onPostUpdate: (post: CommunityPost) => void;
  onPostDeleted: (postId: string) => void;
}) {
  const href = communityPostPath(communityId, post.post_id);
  const images = post.image_urls ?? [];
  const commentLabel =
    post.comment_count === 1
      ? "1 comment"
      : `${post.comment_count} comments`;

  return (
    <article className="rounded-2xl border border-nurture-sage/20 bg-white p-4 shadow-sm transition hover:border-nurture-sage/35">
      <div className="flex gap-3">
        <AuthorAvatar
          name={post.author_name}
          imageUrl={post.author_avatar_url}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-nurture-charcoal">
              {post.author_name}
            </span>
            <span className="text-xs text-nurture-charcoal/45">
              {formatPostTime(post.created_at)}
            </span>
          </div>

          <Link href={href} className="mt-2 block group">
            {post.title ? (
              <h3 className="font-serif text-base font-semibold text-nurture-charcoal group-hover:text-nurture-sage-dark">
                {post.title}
              </h3>
            ) : null}
            {post.body ? (
              <p
                className={`leading-relaxed text-nurture-charcoal/80 ${post.title ? "mt-1" : "mt-2"} line-clamp-4`}
              >
                {excerptBody(post.body)}
              </p>
            ) : null}
          </Link>
          {images.length > 0 ? (
            <Link href={href} className="block">
              <PostImages urls={images} compact />
            </Link>
          ) : null}

          <PostReactionsControlled
            post={post}
            communityId={communityId}
            demoMode={demoMode}
            onPostUpdate={onPostUpdate}
          />

          <Link
            href={href}
            className="mt-2 inline-block text-sm font-medium text-nurture-sage-dark hover:underline"
          >
            {commentLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CommunityFeed({
  communityId,
  isMember,
  demoMode = false,
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(demoMode);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isMember || demoMode) return;
    fetchMemberProfile()
      .then((profile) => {
        setMyAvatarUrl(profile.avatar_url || null);
        setMyUserId(profile.user_id);
      })
      .catch(() => undefined);
  }, [isMember, demoMode]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setPosts(getDemoPostsForCommunity(communityId));
        setUsingDemo(true);
        return;
      }
      const { results } = await runWithAutoRetry(() =>
        fetchCommunityPosts(communityId)
      );
      setPosts(results.map(withDefaultReactions));
      setUsingDemo(false);
    } catch (err) {
      setPosts([]);
      setError(err instanceof Error ? err.message : "Could not load posts");
    } finally {
      setLoading(false);
    }
  }, [communityId, demoMode]);

  useEffect(() => {
    if (!isMember) {
      setLoading(false);
      return;
    }
    void loadPosts();
  }, [isMember, loadPosts]);

  const handleCreatePost = async (payload: {
    body: string;
    imageUrls: string[];
  }) => {
    const text = payload.body.trim();
    if ((!text && payload.imageUrls.length === 0) || posting) return;

    setPosting(true);
    setError(null);
    try {
      if (usingDemo) {
        const demoPost: CommunityPost = withDefaultReactions({
          post_id: `demo-post-${Date.now()}`,
          community_id: communityId,
          author_id: "demo-user",
          author_name: "You",
          title: "",
          body: text,
          image_urls: payload.imageUrls,
          comment_count: 0,
          reactions: { total: 0, counts: {}, user_reaction: null },
          created_at: new Date().toISOString(),
        });
        setPosts((prev) => [demoPost, ...prev]);
        return;
      }

      const created = await createCommunityPost(communityId, {
        body: text,
        image_urls: payload.imageUrls,
      });
      const withImages = withDefaultReactions({
        ...created,
        image_urls:
          (created.image_urls?.length ?? 0) > 0
            ? created.image_urls!
            : payload.imageUrls,
      });
      setPosts((prev) => [withImages, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create post");
      throw err;
    } finally {
      setPosting(false);
    }
  };

  if (!isMember) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-nurture-sage/30 bg-nurture-cream/40 p-6">
        <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Community feed
        </h2>
        <p className="mt-2 text-sm text-nurture-charcoal/70">
          Join this community to read posts and join the conversation.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
        Community feed
      </h2>
      <p className="mt-1 text-sm text-nurture-charcoal/60">
        Share updates and ask questions — comments thread under each post.
      </p>

      {usingDemo ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Preview mode.</strong> Sample posts only — start{" "}
          <code className="rounded bg-white/70 px-1">community-service</code> and
          set <code className="rounded bg-white/70 px-1">COMMUNITY_API_URL</code>{" "}
          in <code className="rounded bg-white/70 px-1">.env.local</code> for a
          live feed.
        </p>
      ) : null}

      {!usingDemo && error ? (
        <div
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
          role="alert"
        >
          <p>{error}</p>
          {isCommunityConnectionError(error) ? (
            <p className="mt-2 text-xs text-red-700">
              From the repo root:{" "}
              <code className="rounded bg-white/60 px-1">
                cd community-service && source .venv/bin/activate && python
                manage.py runserver 0.0.0.0:8001
              </code>
              . Then restart Next.js so{" "}
              <code className="rounded bg-white/60 px-1">COMMUNITY_API_URL</code>{" "}
              is picked up.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void loadPosts()}
            className="mt-2 text-xs font-medium text-red-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <PostComposer
        communityId={communityId}
        posting={posting}
        authorAvatarUrl={myAvatarUrl}
        onSubmit={handleCreatePost}
      />

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-nurture-charcoal/60">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-nurture-sage/25 bg-nurture-cream/30 px-4 py-8 text-center text-sm text-nurture-charcoal/65">
            No posts yet. Start the conversation above.
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.post_id}
              communityId={communityId}
              post={post}
              demoMode={usingDemo}
              myUserId={myUserId}
              onPostUpdate={(updated) =>
                setPosts((prev) =>
                  prev.map((p) =>
                    p.post_id === updated.post_id ? updated : p
                  )
                )
              }
              onPostDeleted={(postId) =>
                setPosts((prev) => prev.filter((p) => p.post_id !== postId))
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
