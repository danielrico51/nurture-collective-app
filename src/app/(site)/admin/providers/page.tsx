"use client";

import ProviderQueue from "@/components/Admin/ProviderQueue";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function AdminProvidersPage() {
  const { ready } = useRequireAdmin();

  if (!ready) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading providers…</p>
    );
  }

  return <ProviderQueue />;
}
