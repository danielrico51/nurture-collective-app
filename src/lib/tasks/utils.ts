import type { ManagementTask } from "@/types/task";

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const formatDueDate = (dueDate: string | null) => {
  if (!dueDate) return "No deadline";
  const date = new Date(`${dueDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export type DueStatus = "none" | "ok" | "soon" | "overdue";

export const getDueStatus = (
  dueDate: string | null,
  completed: boolean
): DueStatus => {
  if (!dueDate || completed) return completed ? "ok" : "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T12:00:00`);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "ok";
};

export const dueStatusStyles: Record<
  DueStatus,
  { badge: string; dot: string }
> = {
  none: {
    badge: "bg-nurture-charcoal/5 text-nurture-charcoal/60",
    dot: "bg-nurture-charcoal/30",
  },
  ok: {
    badge: "bg-nurture-sage/15 text-nurture-sage-dark",
    dot: "bg-nurture-sage",
  },
  soon: {
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  overdue: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

export const countOverdue = (tasks: ManagementTask[]) =>
  tasks.filter((t) => !t.completed && getDueStatus(t.dueDate, false) === "overdue")
    .length;
