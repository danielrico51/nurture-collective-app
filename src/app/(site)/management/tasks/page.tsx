"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** @deprecated Use /admin/tasks */
export default function LegacyManagementTasksPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/tasks");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-nurture-charcoal/60">Redirecting…</p>
    </div>
  );
}
