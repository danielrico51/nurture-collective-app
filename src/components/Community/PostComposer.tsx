"use client";

import { AuthorAvatar } from "@/components/Community/AuthorAvatar";
import {
  ALLOWED_POST_IMAGE_TYPES,
  validatePostImageFile,
} from "@/lib/community/postImageClient";
import { uploadCommunityPostImage } from "@/lib/api/communityDiscussionApi";
import { useEffect, useId, useRef, useState } from "react";

const MAX_PHOTOS = 4;

export interface PostComposerPayload {
  title?: string;
  body: string;
  imageUrls: string[];
}

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface PostComposerProps {
  authorName?: string;
  authorAvatarUrl?: string | null;
  communityId: string;
  posting: boolean;
  onSubmit: (payload: PostComposerPayload) => Promise<void>;
}

export function PostComposer({
  authorName = "You",
  authorAvatarUrl = null,
  communityId,
  posting,
  onSubmit,
}: PostComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputId = useId();

  useEffect(() => {
    if (expanded) {
      textareaRef.current?.focus();
    }
  }, [expanded]);

  useEffect(
    () => () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [photos]
  );

  const reset = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setBody("");
    setExpanded(false);
    setError(null);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos per post.`);
      return;
    }

    const next: PendingPhoto[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      const validationError = validatePostImageFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (next.length) {
      setExpanded(true);
      setPhotos((current) => [...current, ...next]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!photos.length) return [];

    const urls: string[] = [];
    for (const photo of photos) {
      const { url } = await uploadCommunityPostImage(communityId, photo.file);
      urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if ((!text && photos.length === 0) || posting || uploading) return;

    setUploading(true);
    setError(null);
    try {
      const imageUrls = await uploadPhotos();
      await onSubmit({ body: text, imageUrls });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create post");
    } finally {
      setUploading(false);
    }
  };

  const busy = posting || uploading;
  const canPost = Boolean(body.trim() || photos.length);

  if (!expanded) {
    return (
      <div className="mt-4 rounded-2xl border border-nurture-sage/20 bg-white shadow-sm">
        <div className="flex items-center gap-3 p-3">
          <AuthorAvatar
            name={authorName}
            imageUrl={authorAvatarUrl}
            size="sm"
          />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-h-[40px] flex-1 rounded-full bg-nurture-cream/80 px-4 text-left text-sm text-nurture-charcoal/55 transition hover:bg-nurture-cream"
          >
            What&apos;s on your mind?
          </button>
          <label
            htmlFor={fileInputId}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-nurture-sage-dark transition hover:bg-nurture-sage/10"
            aria-label="Add photo"
          >
            <PhotoIcon />
          </label>
          <input
            id={fileInputId}
            type="file"
            accept={ALLOWED_POST_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            onChange={(event) => {
              addPhotos(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 overflow-hidden rounded-2xl border border-nurture-sage/25 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-nurture-sage/10 p-3">
        <AuthorAvatar
          name={authorName}
          imageUrl={authorAvatarUrl}
          size="sm"
        />
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          maxLength={8000}
          className="min-h-[72px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-nurture-charcoal outline-none placeholder:text-nurture-charcoal/45"
        />
      </div>

      {photos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-3 py-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-nurture-cream"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-xs text-white"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="px-3 pb-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-nurture-sage/10 px-3 py-2">
        <div className="flex items-center gap-1">
          <label
            htmlFor={`${fileInputId}-expanded`}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-nurture-sage-dark transition hover:bg-nurture-sage/10 ${photos.length >= MAX_PHOTOS ? "pointer-events-none opacity-40" : ""}`}
            aria-label="Add photo"
          >
            <PhotoIcon />
          </label>
          <input
            id={`${fileInputId}-expanded`}
            type="file"
            accept={ALLOWED_POST_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            disabled={photos.length >= MAX_PHOTOS}
            onChange={(event) => {
              addPhotos(event.target.files);
              event.target.value = "";
            }}
          />
          <span className="text-xs text-nurture-charcoal/45">Photo</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-nurture-charcoal/60 hover:bg-nurture-cream disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !canPost}
            className="rounded-full bg-nurture-sage px-4 py-1.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-50"
          >
            {uploading ? "Uploading…" : posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PhotoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm2 0v14h12V5H6zm2.5 11.5 2.5-3 2 2.5 1.5-2 3.5 4.5H8l2.5-4zM9 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </svg>
  );
}
