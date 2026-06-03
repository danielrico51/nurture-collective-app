"use client";

import { CohortRecommendations } from "@/components/Community/CohortRecommendations";
import { CommunityList } from "@/components/Community/CommunityList";
import { MemberAppIcon } from "@/components/Member/MemberAppIcon";
import { getMemberAppById } from "@/config/memberApps";
import { useRequireMember } from "@/hooks/useRequireMember";
import { isCommunityDevScope } from "@/lib/community/config";

export function CommunityView() {
  const { ready, loading } = useRequireMember();
  const app = getMemberAppById("community");

  if (loading || !ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading community…</p>
      </div>
    );
  }

  const devScope = isCommunityDevScope();

  return (
    <div className="max-w-4xl">
      <div className="rounded-2xl border border-nurture-sage/15 bg-gradient-to-br from-nurture-cream/80 to-white px-6 py-8 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-nurture-sage/15 text-nurture-sage-dark">
            <MemberAppIcon icon="community" className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-nurture-sage-dark">
              Member app
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
              {app?.title ?? "Community"}
            </h2>
            <p className="mt-3 font-serif text-lg font-medium leading-snug text-nurture-sage-dark sm:text-xl">
              Every mom deserves a team
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-nurture-charcoal/75">
              Building communities where moms lift each other up
            </p>
          </div>
        </div>
        {devScope ? (
          <p className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-950">
            <strong>Dev preview:</strong> Posts and photos you add here are only
            visible on this dev environment — production members will not see
            them.
          </p>
        ) : null}
      </div>

      <div className="mt-8 space-y-8">
        <CohortRecommendations />
        <CommunityList />
      </div>
    </div>
  );
}
