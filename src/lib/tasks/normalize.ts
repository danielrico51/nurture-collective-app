import type { ManagementTask } from "@/types/task";

type RawTask = Partial<ManagementTask> & {
  assignee?: string;
  assignees?: string[];
};

export const parseAssigneeList = (
  assignees?: string[],
  legacyAssignee?: string
): string[] => {
  if (Array.isArray(assignees)) {
    return [...new Set(assignees.map((name) => name.trim()).filter(Boolean))];
  }

  if (!legacyAssignee?.trim()) return [];

  return [
    ...new Set(
      legacyAssignee
        .split(/[/,]+/)
        .map((name) => name.trim())
        .filter(Boolean)
    ),
  ];
};

export const normalizeTask = (raw: RawTask): ManagementTask => {
  const assignees = parseAssigneeList(raw.assignees, raw.assignee);

  return {
    id: raw.id ?? "",
    title: raw.title ?? "",
    description: raw.description ?? "",
    assignees,
    dueDate: raw.dueDate ?? null,
    urgent: raw.urgent ?? false,
    completed: raw.completed ?? false,
    completedAt: raw.completedAt ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    createdBy: raw.createdBy ?? "",
  };
};
