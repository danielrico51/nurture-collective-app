"use client";

import {
  deleteCommunityPost,
  updateCommunityPost,
  type CommunityPost,
} from "@/lib/api/communityDiscussionApi";
import { communityDetailPath } from "@/lib/community/paths";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface PostOwnerMenuProps {
  communityId: string;
  post: CommunityPost;
  myUserId: string | null;
  demoMode?: boolean;
  /** compact = icon row on feed card; full = edit form on post page */
  variant?: "compact" | "full";
  onUpdated?: (post: CommunityPost) => void;
  onDeleted?: () => void;
}

export function PostOwnerMenu({
  communityId,
  post,
  myUserId,
  demoMode = false,
  variant = "compact",
  onUpdated,
  onDeleted,
}: PostOwnerMenuProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.body);
  const [title, setTitle] = useState(post.title);
  const [busy, setBusy] = useState(false);

  const isOwner =
    Boolean(myUserId) && myUserId === post.author_id && !demoMode;

  if (!isOwner) return null;

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete this post? Comments and reactions will be removed too."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteCommunityPost(communityId, post.post_id);
      toast.success("Post deleted");
      if (onDeleted) {
        onDeleted();
      } else {
        router.push(communityDetailPath(communityId));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete post");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    const text = body.trim();
    const imageUrls = post.image_urls ?? [];
    if (!text && imageUrls.length === 0) {
      toast.error("Add some text or keep at least one photo.");
      return;
    }
    setBusy(true);
    try {
      const updated = await updateCommunityPost(communityId, post.post_id, {
        title: title.trim(),
        body: text,
        image_urls: imageUrls,
      });
      toast.success("Post updated");
      setEditing(false);
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update post");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "full" && editing) {
    return (
      <div className="mt-4 rounded-xl border border-nurture-sage/20 bg-nurture-cream/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
          Edit your post
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={300}
          className="mt-3 w-full rounded-lg border border-nurture-sage/15 px-3 py-2 text-sm outline-none focus:border-nurture-sage"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={8000}
          className="mt-2 w-full resize-y rounded-lg border border-nurture-sage/15 px-3 py-2.5 text-sm outline-none focus:border-nurture-sage"
        />
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setBody(post.body);
              setTitle(post.title);
            }}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        variant === "full"
          ? "mt-4 flex flex-wrap gap-2 border-t border-nurture-sage/10 pt-4"
          : "mt-2 flex flex-wrap gap-2"
      }
    >
      {variant === "full" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditing(true)}
          className="rounded-full border border-nurture-sage/30 px-4 py-1.5 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
        >
          Edit
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleDelete();
        }}
        className="rounded-full border border-red-200/80 px-4 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
