"use client";

import { CommunityFeed } from "@/components/Community/CommunityFeed";
import { JoinCommunityButton } from "@/components/Community/JoinCommunityButton";
import { LeaveCommunityButton } from "@/components/Community/LeaveCommunityButton";
import { loadCommunityDetail } from "@/lib/community/client";
import { communityListPath } from "@/lib/community/paths";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface CommunityDetailViewProps {
  communityId: string;
}

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-nurture-cream px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-nurture-sage-dark"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function CommunityDetailView({ communityId }: CommunityDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof loadCommunityDetail>
  >["detail"] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { detail: nextDetail, demoMode: usingDemo } =
        await loadCommunityDetail(communityId);
      setDetail(nextDetail);
      setDemoMode(usingDemo);
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : "Could not load community");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLeft = () => {
    router.push(communityListPath);
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-sm text-nurture-charcoal/60">Loading community…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Something went wrong
        </h3>
        <p className="mt-2 text-sm text-red-700">
          {error ?? "Community not found"}
        </p>
        <Link
          href={communityListPath}
          className="mt-4 inline-block text-sm font-medium text-nurture-sage-dark hover:underline"
        >
          Back to communities
        </Link>
      </div>
    );
  }

  const isMember = Boolean(detail.my_membership);

  return (
    <div className="max-w-3xl">
      <Link
        href={communityListPath}
        className="text-sm font-medium text-nurture-sage-dark hover:underline"
      >
        ← All communities
      </Link>

      {demoMode ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> Example community data — connect{" "}
          <code className="rounded bg-white/70 px-1">community-service</code> for
          live details.
        </div>
      ) : null}

      <header className="mt-6 rounded-2xl border border-nurture-sage/20 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-semibold text-nurture-charcoal">
                {detail.name}
              </h1>
              {isMember ? (
                <span className="rounded-full bg-nurture-cream px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nurture-sage-dark">
                  {detail.my_membership?.role ?? "member"}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/75">
              {detail.description || "No description yet."}
            </p>
            <p className="mt-3 text-xs text-nurture-charcoal/50">
              {detail.member_count ?? 0} members · {detail.visibility}
            </p>
            <TagList tags={detail.tags} />
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {isMember ? (
              <LeaveCommunityButton communityId={communityId} onLeft={handleLeft} />
            ) : (
              <JoinCommunityButton communityId={communityId} onJoined={load} />
            )}
          </div>
        </div>
      </header>

      <CommunityFeed
        communityId={communityId}
        isMember={isMember}
        demoMode={demoMode}
      />
    </div>
  );
}
