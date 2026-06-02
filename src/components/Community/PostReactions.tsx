"use client";

import {
  setPostReaction,
  type CommunityPost,
} from "@/lib/api/communityDiscussionApi";
import {
  REACTION_EMOJI,
  REACTION_LABELS,
  REACTION_TYPES,
  topReactionTypes,
  type PostReactions,
  type ReactionType,
} from "@/lib/community/reactions";
import { useCallback, useEffect, useRef, useState } from "react";

interface PostReactionsProps {
  communityId: string;
  postId: string;
  reactions: PostReactions;
  demoMode?: boolean;
  onReactionsChange?: (reactions: PostReactions) => void;
  compact?: boolean;
}

export function PostReactionsBar({
  communityId,
  postId,
  reactions,
  demoMode = false,
  onReactionsChange,
  compact = false,
}: PostReactionsProps) {
  const [local, setLocal] = useState(reactions);
  useEffect(() => {
    setLocal(reactions);
  }, [reactions]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const update = useCallback(
    (next: PostReactions) => {
      setLocal(next);
      onReactionsChange?.(next);
    },
    [onReactionsChange]
  );

  const applyDemoReaction = (type: ReactionType) => {
    const counts = { ...local.counts };
    const prev = local.user_reaction;

    if (prev === type) {
      const n = (counts[type] ?? 1) - 1;
      if (n <= 0) delete counts[type];
      else counts[type] = n;
      update({
        total: Math.max(0, local.total - 1),
        counts,
        user_reaction: null,
      });
      return;
    }

    if (prev && counts[prev]) {
      const n = counts[prev]! - 1;
      if (n <= 0) delete counts[prev];
      else counts[prev] = n;
    }
    counts[type] = (counts[type] ?? 0) + 1;
    update({
      total: prev ? local.total : local.total + 1,
      counts,
      user_reaction: type,
    });
  };

  const handlePick = async (type: ReactionType) => {
    setPickerOpen(false);
    setError(null);

    if (demoMode) {
      applyDemoReaction(type);
      return;
    }

    setBusy(true);
    try {
      const { reactions: next } = await setPostReaction(communityId, postId, type);
      update(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save reaction");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pickerOpen]);

  const userReaction = local.user_reaction;
  const summaryTypes = topReactionTypes(local.counts);
  const triggerEmoji = userReaction ? REACTION_EMOJI[userReaction] : "👍";
  const triggerLabel = userReaction ? REACTION_LABELS[userReaction] : "Like";

  return (
    <div
      className={`flex flex-col gap-1 ${compact ? "" : "mt-3 border-t border-nurture-sage/10 pt-3"}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-2">
        {local.total > 0 ? (
          <div
            className="flex items-center gap-1.5 rounded-full bg-nurture-cream/80 px-2.5 py-1 text-xs text-nurture-charcoal/70"
            title={Object.entries(local.counts)
              .map(([t, n]) => `${REACTION_LABELS[t as ReactionType]} ${n}`)
              .join(", ")}
          >
            <span className="flex -space-x-0.5">
              {summaryTypes.map((t) => (
                <span key={t} className="text-sm leading-none" aria-hidden>
                  {REACTION_EMOJI[t]}
                </span>
              ))}
            </span>
            <span>{local.total}</span>
          </div>
        ) : null}

        {/* Picker + trigger share one hover/click target (no gap). */}
        <div
          ref={rootRef}
          className="inline-flex flex-col-reverse items-start gap-0"
          onMouseEnter={() => setPickerOpen(true)}
          onMouseLeave={() => setPickerOpen(false)}
        >
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPickerOpen((open) => !open);
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              userReaction
                ? "bg-nurture-sage/15 text-nurture-sage-dark"
                : "text-nurture-charcoal/60 hover:bg-nurture-cream hover:text-nurture-sage-dark"
            }`}
            aria-expanded={pickerOpen}
            aria-haspopup="true"
          >
            <span className="text-base leading-none" aria-hidden>
              {triggerEmoji}
            </span>
            {triggerLabel}
          </button>

          {pickerOpen ? (
            <div
              className="flex gap-0.5 rounded-full border border-nurture-sage/20 bg-white px-1.5 py-1.5 shadow-lg"
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              {REACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="menuitem"
                  title={REACTION_LABELS[type]}
                  disabled={busy}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handlePick(type);
                  }}
                  className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl transition hover:scale-110 hover:bg-nurture-cream active:scale-95 disabled:opacity-50 ${
                    userReaction === type
                      ? "bg-nurture-sage/20 ring-2 ring-nurture-sage/40"
                      : ""
                  }`}
                >
                  <span aria-hidden>{REACTION_EMOJI[type]}</span>
                  <span className="sr-only">{REACTION_LABELS[type]}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Sync reactions when parent post object updates (e.g. after refetch). */
export function PostReactionsControlled({
  post,
  communityId,
  demoMode,
  onPostUpdate,
  compact,
}: {
  post: CommunityPost;
  communityId: string;
  demoMode?: boolean;
  onPostUpdate: (post: CommunityPost) => void;
  compact?: boolean;
}) {
  return (
    <PostReactionsBar
      communityId={communityId}
      postId={post.post_id}
      reactions={post.reactions}
      demoMode={demoMode}
      compact={compact}
      onReactionsChange={(reactions) => onPostUpdate({ ...post, reactions })}
    />
  );
}
