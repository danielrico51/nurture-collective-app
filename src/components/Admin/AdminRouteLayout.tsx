"use client";

import { AdminAccessDenied } from "@/components/Admin/AdminAccessDenied";
import { AdminShell } from "@/components/Admin/AdminShell";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import AdminTourHost from "@/tour/AdminTourHost";

const AdminRouteLayout = ({ children }: { children: React.ReactNode }) => {
  const { ready, loading, denied, groups, refreshGroups, refreshing } =
    useRequireAdmin();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading admin workspace…</p>
      </div>
    );
  }

  if (denied) {
    return (
      <AdminAccessDenied
        groups={groups}
        onRefresh={refreshGroups}
        refreshing={refreshing}
      />
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <AdminShell>
      <AdminTourHost />
      {children}
    </AdminShell>
  );
};

export default AdminRouteLayout;
