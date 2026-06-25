"use client";

import DashboardAnalyticsView from "@/components/Admin/DashboardAnalytics";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function AdminDashboardPage() {
  const { ready } = useRequireAdmin();

  if (!ready) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading dashboard…</p>
    );
  }

  return <DashboardAnalyticsView />;
}
