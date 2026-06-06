import type { ManagementTask } from "@/types/task";
import type { TeamMember } from "@/types/teamMember";

export const formatAssignees = (assignees: string[]) => {
  if (assignees.length === 0) return "Unassigned";
  return assignees.join(", ");
};

export const getUserAssigneeMatchers = (
  userEmail?: string,
  userDisplayName?: string,
  member?: TeamMember | null
): string[] => {
  const matchers = new Set<string>();
  const add = (value?: string) => {
    if (value?.trim()) matchers.add(value.trim().toLowerCase());
  };

  add(userEmail);
  add(userDisplayName);
  add(userEmail?.split("@")[0]);

  if (member) {
    add(member.label);
    add(member.username);
    add(member.email);
    add(member.label.split(/\s+/)[0]);
  }

  return Array.from(matchers);
};

export const shouldSyncTaskToGoogleForUser = (
  task: ManagementTask,
  matchers: string[]
): boolean => {
  if (task.category !== "internal" || matchers.length === 0) return false;
  return taskAssignedToUser(task, matchers);
};

/** In-progress internal tasks assigned to the user (eligible for Google push). */
export const shouldPushTaskToGoogleForUser = (
  task: ManagementTask,
  matchers: string[]
): boolean => shouldSyncTaskToGoogleForUser(task, matchers) && !task.completed;

export const taskAssignedToUser = (
  task: ManagementTask,
  matchers: string[]
): boolean => {
  if (matchers.length === 0) return false;

  return task.assignees.some((assignee) => {
    const normalizedAssignee = assignee.trim().toLowerCase();
    if (!normalizedAssignee) return false;

    return matchers.some((matcher) => {
      const normalizedMatcher = matcher.trim().toLowerCase();
      if (!normalizedMatcher) return false;
      if (normalizedAssignee === normalizedMatcher) return true;

      const assigneeFirst = normalizedAssignee.split(/\s+/)[0];
      const matcherFirst = normalizedMatcher.split(/\s+/)[0];

      if (
        assigneeFirst.length >= 2 &&
        matcherFirst.length >= 2 &&
        assigneeFirst === matcherFirst
      ) {
        return true;
      }

      return (
        normalizedMatcher.startsWith(`${normalizedAssignee} `) ||
        normalizedMatcher.startsWith(`${normalizedAssignee}/`) ||
        normalizedAssignee.startsWith(`${normalizedMatcher} `) ||
        normalizedAssignee.startsWith(`${normalizedMatcher}/`)
      );
    });
  });
};

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
