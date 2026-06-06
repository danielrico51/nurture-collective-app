import type { ManagementTask } from "@/types/task";

export interface GoogleTaskPayload {
  id?: string | null;
  title?: string | null;
  notes?: string | null;
  due?: string | null;
  status?: string | null;
  completed?: string | null;
  updated?: string | null;
}

const APP_ID_PREFIX = "nurture-task-id:";
const METADATA_END = "---";

export const shouldSyncTaskToGoogle = (task: ManagementTask): boolean =>
  task.category === "internal";

const formatAssignees = (assignees: string[]) =>
  assignees.length ? assignees.join(", ") : "Unassigned";

export const buildGoogleTaskNotes = (task: ManagementTask): string => {
  const meta = [
    `${APP_ID_PREFIX}${task.id}`,
    `Assignees: ${formatAssignees(task.assignees)}`,
    task.urgent ? "Urgent: yes" : null,
    task.createdBy ? `Created by: ${task.createdBy}` : null,
    METADATA_END,
  ]
    .filter(Boolean)
    .join("\n");

  const body = task.description.trim();
  return body ? `${meta}\n${body}` : meta;
};

export const parseAppTaskIdFromNotes = (notes?: string | null): string | null => {
  if (!notes) return null;
  const line = notes
    .split("\n")
    .find((row) => row.startsWith(APP_ID_PREFIX));
  if (!line) return null;
  return line.slice(APP_ID_PREFIX.length).trim() || null;
};

export const parseDescriptionFromNotes = (notes?: string | null): string => {
  if (!notes) return "";
  const endIndex = notes.indexOf(`\n${METADATA_END}`);
  if (endIndex === -1) return notes.trim();
  const after = notes.slice(endIndex + METADATA_END.length + 1).trim();
  return after;
};

const toGoogleDue = (dueDate: string | null): string | undefined => {
  if (!dueDate) return undefined;
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const fromGoogleDue = (due?: string | null): string | null => {
  if (!due) return null;
  const parsed = new Date(due);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const parseGoogleUpdatedAt = (updated?: string | null): number => {
  if (!updated) return 0;
  const parsed = Date.parse(updated);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const managementTaskToGoogleTask = (
  task: ManagementTask,
  existing?: GoogleTaskPayload | null,
  userEmail?: string
): GoogleTaskPayload => ({
  id:
    existing?.id ??
    (userEmail ? task.googleTaskIdsByUser[userEmail.trim().toLowerCase()] : undefined) ??
    task.googleTaskId ??
    undefined,
  title: task.urgent && !task.completed ? `[URGENT] ${task.title}` : task.title,
  notes: buildGoogleTaskNotes(task),
  due: toGoogleDue(task.dueDate),
  status: task.completed ? "completed" : "needsAction",
  completed: task.completed ? task.completedAt ?? task.updatedAt : undefined,
});

export const applyGoogleTaskToManagement = (
  googleTask: GoogleTaskPayload,
  current: ManagementTask,
  userEmail?: string
): ManagementTask => {
  const title = (googleTask.title ?? current.title).replace(/^\[URGENT\]\s*/i, "");
  const completed = googleTask.status === "completed";
  const googleUpdated = parseGoogleUpdatedAt(googleTask.updated);
  const localUpdated = Date.parse(current.updatedAt);

  if (googleUpdated < localUpdated) {
    return current;
  }

  const normalizedUser = userEmail?.trim().toLowerCase();
  const googleTaskIdsByUser =
    normalizedUser && googleTask.id
      ? { ...current.googleTaskIdsByUser, [normalizedUser]: googleTask.id }
      : current.googleTaskIdsByUser;

  return {
    ...current,
    title,
    description: parseDescriptionFromNotes(googleTask.notes),
    dueDate: fromGoogleDue(googleTask.due),
    urgent: /^\[URGENT\]/i.test(googleTask.title ?? "") || current.urgent,
    completed,
    completedAt: completed
      ? fromGoogleDue(googleTask.completed) ?? current.completedAt ?? new Date().toISOString()
      : null,
    updatedAt: googleTask.updated ?? current.updatedAt,
    googleTaskId: googleTask.id ?? current.googleTaskId,
    googleTaskIdsByUser,
  };
};
