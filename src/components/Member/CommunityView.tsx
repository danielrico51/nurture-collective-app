"use client";

import { CommunityList } from "@/components/Community/CommunityList";
import { MemberAppIcon } from "@/components/Member/MemberAppIcon";
import { getMemberAppById } from "@/config/memberApps";
import { useRequireMember } from "@/hooks/useRequireMember";

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

  return (
    <div className="max-w-4xl">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-nurture-sage/15 text-nurture-sage-dark">
          <MemberAppIcon icon="community" className="h-7 w-7" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-nurture-sage-dark">
            Member app
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-nurture-charcoal">
            {app?.title ?? "Community"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-nurture-charcoal/70">
            {app?.description ??
              "Connect with other moms — browse groups, join conversations, and find your stage."}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CommunityList />
      </div>
    </div>
  );
}
