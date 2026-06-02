"use client";

import { CreateCommunityForm } from "@/components/Community/CreateCommunityForm";
import { JoinCommunityButton } from "@/components/Community/JoinCommunityButton";
import { LeaveCommunityButton } from "@/components/Community/LeaveCommunityButton";
import {
  loadCommunityPageData,
  joinCommunityWithFallback,
  leaveCommunityWithFallback,
} from "@/lib/community/client";
import type { CommunitySummary, MyCommunity } from "@/lib/api/communityApi";
import { communityDetailPath } from "@/lib/community/paths";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
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

export function CommunityList() {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [mine, setMine] = useState<MyCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { listing, mine, demoMode: usingDemo } = await loadCommunityPageData();
      setCommunities(listing.results);
      setMine(mine.results);
      setDemoMode(usingDemo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load communities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const joinedIds = new Set(mine.map((item) => item.community_id));

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-sm text-nurture-charcoal/60">Loading communities…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Something went wrong
        </h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {demoMode ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> These are example communities so you can
          explore the app. Join and leave work locally in your browser. Connect{" "}
          <code className="rounded bg-white/70 px-1">community-service</code> with{" "}
          <code className="rounded bg-white/70 px-1">COMMUNITY_API_URL</code> for
          live data.
        </div>
      ) : null}

      <div className="rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
              Start your own community
            </h2>
            <p className="mt-1 text-sm text-nurture-charcoal/65">
              Bring together moms who share your stage, interests, or neighborhood.
            </p>
          </div>
          <CreateCommunityForm onCreated={load} />
        </div>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-nurture-charcoal">
              Your communities
            </h2>
            <p className="mt-1 text-sm text-nurture-charcoal/65">
              Groups you&apos;ve joined or created — check back here for updates and discussions.
            </p>
          </div>
          <span className="rounded-full bg-nurture-sage/10 px-3 py-1 text-xs font-semibold text-nurture-sage-dark">
            {mine.length} joined
          </span>
        </div>

        {mine.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-nurture-sage/25 bg-white/70 p-6">
            <p className="text-sm text-nurture-charcoal/70">
              You haven&apos;t joined a community yet. Browse public groups below to
              find moms in your stage.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {mine.map((community) => (
              <li
                key={community.membership_id}
                className="rounded-2xl border border-nurture-sage/20 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-nurture-charcoal">
                        {community.name}
                      </p>
                      <span className="rounded-full bg-nurture-cream px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nurture-sage-dark">
                        {community.role}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-nurture-charcoal/70">
                      {community.description || "No description yet."}
                    </p>
                    <TagList tags={community.tags} />
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    <Link
                      href={communityDetailPath(community.community_id)}
                      className="inline-flex justify-center rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark"
                    >
                      View
                    </Link>
                    <LeaveCommunityButton
                      communityId={community.community_id}
                      onLeft={load}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div>
          <h2 className="font-serif text-xl font-semibold text-nurture-charcoal">
            Discover
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Public communities open to all members. More stage-based groups are on the way.
          </p>
        </div>

        <ul className="mt-5 space-y-4">
          {communities.map((community) => (
            <li
              key={community.community_id}
              className="flex flex-col gap-4 rounded-2xl border border-nurture-blush/30 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-nurture-charcoal">{community.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-nurture-charcoal/70">
                  {community.description || "No description yet."}
                </p>
                <p className="mt-2 text-xs text-nurture-charcoal/50">
                  {community.member_count ?? 0} members · {community.visibility}
                </p>
                <TagList tags={community.tags} />
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <Link
                  href={communityDetailPath(community.community_id)}
                  className="inline-flex justify-center rounded-full border border-nurture-sage px-4 py-2 text-sm font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10"
                >
                  {joinedIds.has(community.community_id) ? "Open" : "View"}
                </Link>
                {joinedIds.has(community.community_id) ? (
                  <span className="text-center text-xs font-medium text-nurture-sage-dark">
                    Joined
                  </span>
                ) : (
                  <JoinCommunityButton
                    communityId={community.community_id}
                    onJoined={load}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
