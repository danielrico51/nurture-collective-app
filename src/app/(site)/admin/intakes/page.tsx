"use client";

import IntakeQueue from "@/components/Admin/IntakeQueue";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function AdminIntakesPage() {
  const { user } = useRequireAdmin();
  const userEmail = user?.signInDetails?.loginId ?? "";

  return <IntakeQueue userEmail={userEmail} />;
}
