"use client";

import TaskBoard from "@/components/Management/TaskBoard";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function AdminTasksPage() {
  const { user } = useRequireAdmin();
  const userEmail = user?.signInDetails?.loginId ?? "";

  return <TaskBoard userEmail={userEmail} />;
}
