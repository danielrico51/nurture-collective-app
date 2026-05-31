"use client";

import { joinCommunityWithFallback } from "@/lib/community/client";
import { useState } from "react";

interface JoinCommunityButtonProps {
  communityId: string;
  onJoined?: () => void;
}

export function JoinCommunityButton({
  communityId,
  onJoined,
}: JoinCommunityButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      await joinCommunityWithFallback(communityId);
      onJoined?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-medium text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
      >
        {loading ? "Joining…" : "Join"}
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
