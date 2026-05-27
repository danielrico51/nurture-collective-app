"use client";

import LeadQueue from "@/components/Admin/LeadQueue";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";

export default function AdminLeadsPage() {
  const { user, ready } = useRequireAdmin();
  const [coordinatorId, setCoordinatorId] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetchAuthSession().then((session) => {
      setCoordinatorId(session.userSub ?? user?.userId ?? "");
    });
  }, [ready, user?.userId]);

  if (!ready || !coordinatorId) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading lead CRM…</p>
    );
  }

  return (
    <LeadQueue
      coordinatorId={coordinatorId}
      coordinatorEmail={user?.signInDetails?.loginId ?? ""}
    />
  );
}
