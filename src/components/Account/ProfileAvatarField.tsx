"use client";

import { authorInitial } from "@/components/Community/discussionHelpers";
import {
  fetchMemberProfile,
  uploadProfileAvatar,
  validateAvatarImageFile,
} from "@/lib/account/profileAvatarClient";
import { updateUserAttributes } from "aws-amplify/auth";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface ProfileAvatarFieldProps {
  displayName: string;
}

export function ProfileAvatarField({ displayName }: ProfileAvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMemberProfile()
      .then((profile) => setAvatarUrl(profile.avatar_url || null))
      .catch(() => {
        /* Community profile optional when service offline */
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAvatarImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      const { url, optimized } = await uploadProfileAvatar(file);
      setAvatarUrl(url);
      try {
        await updateUserAttributes({ userAttributes: { picture: url } });
      } catch {
        /* picture attribute optional */
      }
      toast.success(
        optimized
          ? "Profile photo updated (optimized for upload)"
          : "Profile photo updated"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const label = displayName.trim() || "Member";
  const initial = authorInitial(label);

  return (
    <div className="flex flex-col items-center gap-4 border-b border-nurture-sage/10 pb-8 sm:flex-row sm:items-center">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-nurture-sage/20 bg-nurture-sage/15">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${label} profile`}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-serif text-2xl font-semibold text-nurture-sage-dark"
            aria-hidden
          >
            {loading ? "…" : initial}
          </span>
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm font-medium text-nurture-charcoal">Profile photo</p>
        <p className="mt-1 text-xs text-nurture-charcoal/60">
          Shown on your community posts and comments. Large photos are resized
          automatically.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
        />
        <button
          type="button"
          disabled={uploading || loading}
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-full border border-nurture-sage/30 px-5 py-2 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
        </button>
      </div>
    </div>
  );
}
