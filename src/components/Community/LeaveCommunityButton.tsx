"use client";

import { leaveCommunityWithFallback } from "@/lib/community/client";
import { useState } from "react";

interface LeaveCommunityButtonProps {
  communityId: string;
  onLeft?: () => void;
}

export function LeaveCommunityButton({
  communityId,
  onLeft,
}: LeaveCommunityButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    setLoading(true);
    setError(null);
    try {
      await leaveCommunityWithFallback(communityId);
      onLeft?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not leave community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleLeave}
        disabled={loading}
        className="rounded-full border border-nurture-charcoal/15 px-4 py-2 text-sm font-medium text-nurture-charcoal/70 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
      >
        {loading ? "Leaving…" : "Leave"}
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
