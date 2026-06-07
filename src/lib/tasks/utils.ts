import type { ManagementTask } from "@/types/task";
import type { TeamMember } from "@/types/teamMember";

export const formatAssignees = (assignees: string[]) => {
  if (assignees.length === 0) return "Unassigned";
  return assignees.join(", ");
};

const normalizeAssigneeToken = (value: string): string =>
  value.trim().toLowerCase();

/** Collapse dotted email locals and usernames for cross-format matching. */
export const normalizeAssigneeIdentity = (value: string): string => {
  const normalized = normalizeAssigneeToken(value);
  const local = normalized.includes("@")
    ? (normalized.split("@")[0] ?? normalized)
    : normalized;
  return local.replace(/\./g, "");
};

export const findTeamMemberForUser = (
  members: TeamMember[],
  options: {
    email?: string;
    loginId?: string;
    displayName?: string;
  }
): TeamMember | null => {
  const email = options.email?.trim().toLowerCase();
  const loginId = options.loginId?.trim().toLowerCase();
  const displayName = options.displayName?.trim().toLowerCase();

  return (
    members.find((member) => {
      const memberEmail = member.email.trim().toLowerCase();
      const memberUsername = member.username.trim().toLowerCase();
      const memberLabel = member.label.trim().toLowerCase();
      const emailLocal = memberEmail.split("@")[0] ?? memberEmail;
      const normalizedEmailLocal = normalizeAssigneeIdentity(memberEmail);

      if (email && memberEmail === email) return true;
      if (email && memberUsername === email) return true;
      if (loginId && memberUsername === loginId) return true;
      if (loginId && emailLocal === loginId) return true;
      if (
        loginId &&
        normalizeAssigneeIdentity(loginId) === normalizedEmailLocal
      ) {
        return true;
      }
      if (displayName && memberLabel === displayName) return true;
      if (displayName && memberUsername === displayName) return true;
      return false;
    }) ?? null
  );
};

export const getUserAssigneeMatchers = (
  userEmail?: string,
  userDisplayName?: string,
  member?: TeamMember | null,
  userLoginId?: string
): string[] => {
  const matchers = new Set<string>();
  const add = (value?: string) => {
    if (value?.trim()) matchers.add(normalizeAssigneeToken(value));
  };

  add(userEmail);
  add(userDisplayName);
  add(userLoginId);
  add(userEmail?.split("@")[0]);
  add(userLoginId?.split("@")[0]);

  if (member) {
    add(member.label);
    add(member.username);
    add(member.email);
    add(member.label.split(/\s+/)[0]);
    add(member.email.split("@")[0]);
    add(normalizeAssigneeIdentity(member.email));
  }

  if (userEmail) add(normalizeAssigneeIdentity(userEmail));
  if (userLoginId) add(normalizeAssigneeIdentity(userLoginId));

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
      const normalizedMatcher = normalizeAssigneeToken(matcher);
      if (!normalizedMatcher) return false;
      if (normalizedAssignee === normalizedMatcher) return true;

      if (
        normalizeAssigneeIdentity(normalizedAssignee) ===
        normalizeAssigneeIdentity(normalizedMatcher)
      ) {
        return true;
      }

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
