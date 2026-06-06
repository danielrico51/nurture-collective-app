import type { ManagementTask } from "@/types/task";

export const normalizeUserEmail = (email: string) => email.trim().toLowerCase();

export const getPersonalGoogleTaskId = (
  task: ManagementTask,
  userEmail: string
): string | null => {
  const normalized = normalizeUserEmail(userEmail);
  const direct = task.googleTaskIdsByUser[normalized];
  if (direct) return direct;
  for (const [key, id] of Object.entries(task.googleTaskIdsByUser)) {
    if (key.trim().toLowerCase() === normalized) return id;
  }
  return null;
};

export const hasPersonalGoogleTaskLink = (
  task: ManagementTask,
  userEmail: string
): boolean => Boolean(getPersonalGoogleTaskId(task, userEmail));

export const withoutPersonalGoogleTaskLink = (
  task: ManagementTask,
  userEmail: string
): ManagementTask => {
  const normalized = normalizeUserEmail(userEmail);
  return {
    ...task,
    googleTaskIdsByUser: Object.fromEntries(
      Object.entries(task.googleTaskIdsByUser).filter(
        ([key]) => key.trim().toLowerCase() !== normalized
      )
    ),
  };
};
