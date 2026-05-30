"use client";

import { MemberAppGrid } from "@/components/Member/MemberAppGrid";

export default function MemberAppsHubPage() {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        Choose an app
      </h2>
      <p className="mt-2 text-sm text-nurture-charcoal/65">
        Your support dashboard, community tools, and resources — built for moms.
        More apps will roll out over time.
      </p>
      <div className="mt-8">
        <MemberAppGrid />
      </div>
    </div>
  );
}
