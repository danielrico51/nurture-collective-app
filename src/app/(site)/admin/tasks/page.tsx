"use client";

import TaskBoard from "@/components/Management/TaskBoard";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function AdminTasksPage() {
  const { user } = useRequireAdmin();
  const userEmail = user?.email ?? user?.loginId ?? "";
  const userLoginId =
    user?.loginId && user.loginId !== user?.email ? user.loginId : undefined;

  return (
    <TaskBoard
      userEmail={userEmail}
      userLoginId={userLoginId}
      userDisplayName={userLoginId}
    />
  );
}
