"use client";

import { MemberShell } from "@/components/Member/MemberShell";
import { useRequireMember } from "@/hooks/useRequireMember";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function MemberAppsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, loading, canAccessAdmin } = useRequireMember();
  const isIntakeFlow = pathname.startsWith("/apps/dashboard/intake");

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading your apps…</p>
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  if (isIntakeFlow) {
    return <>{children}</>;
  }

  return (
    <MemberShell canAccessAdmin={canAccessAdmin}>{children}</MemberShell>
  );
}
