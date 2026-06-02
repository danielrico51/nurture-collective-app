"use client";

import { CommunityDetailView } from "@/components/Community/CommunityDetailView";
import { MemberAppIcon } from "@/components/Member/MemberAppIcon";
import { getMemberAppById } from "@/config/memberApps";
import { useRequireMember } from "@/hooks/useRequireMember";

interface CommunityDetailPageProps {
  params: { communityId: string };
}

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
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
      <div className="mb-8 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nurture-sage/15 text-nurture-sage-dark">
          <MemberAppIcon icon="community" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-nurture-sage-dark">
            Member app
          </p>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            {app?.title ?? "Community"}
          </p>
        </div>
      </div>

      <CommunityDetailView communityId={params.communityId} />
    </div>
  );
}
