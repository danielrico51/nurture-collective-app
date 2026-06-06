import {
  isGoogleTasksActive,
  isLegacyGoogleTasksSync,
  isPersonalGoogleTasksSync,
  serverGoogleTasksConfig,
} from "@/config/googleTasks";
import {
  migrateInternalTasksForUser,
  pullInternalTasksForUser,
  syncInternalTaskToConnectedUsers,
} from "@/lib/tasks/googleUserSync";
import {
  createGoogleTask,
  deleteGoogleTask,
  getGoogleTask,
  getOrCreateTaskListId,
  listGoogleTasks,
  updateGoogleTask,
} from "@/lib/integrations/google/tasksClient";
import {
  applyGoogleTaskToManagement,
  managementTaskToGoogleTask,
  parseAppTaskIdFromNotes,
  shouldSyncTaskToGoogle,
} from "@/lib/tasks/googleSyncMapping";
import { listTasks, saveTasks } from "@/lib/tasks/storage";
import {
  getUserAssigneeMatchers,
  shouldPushTaskToGoogleForUser,
  shouldSyncTaskToGoogleForUser,
} from "@/lib/tasks/utils";
import type { ManagementTask } from "@/types/task";

export {
  applyGoogleTaskToManagement,
  buildGoogleTaskNotes,
  managementTaskToGoogleTask,
  parseAppTaskIdFromNotes,
  parseDescriptionFromNotes,
  shouldSyncTaskToGoogle,
} from "@/lib/tasks/googleSyncMapping";

const persistGoogleTaskId = async (
  taskId: string,
  googleTaskId: string
): Promise<void> => {
  const tasks = await listTasks();
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return;
  tasks[index] = { ...tasks[index], googleTaskId, updatedAt: new Date().toISOString() };
  await saveTasks(tasks);
};

export const syncInternalTaskToGoogle = async (
  task: ManagementTask,
  action: "create" | "update" | "delete",
  userEmail?: string
): Promise<ManagementTask> => {
  if (!isGoogleTasksActive() || !shouldSyncTaskToGoogle(task)) {
    return task;
  }

  if (isPersonalGoogleTasksSync()) {
    return syncInternalTaskToConnectedUsers(task, action);
  }

  const matchers = getUserAssigneeMatchers(userEmail);
  if (!shouldSyncTaskToGoogleForUser(task, matchers)) {
    return task;
  }

  try {
    const taskListId = await getOrCreateTaskListId();

    if (action === "delete") {
      if (task.googleTaskId) {
        await deleteGoogleTask(taskListId, task.googleTaskId);
      }
      return task;
    }

    const existing = task.googleTaskId
      ? await getGoogleTask(taskListId, task.googleTaskId)
      : null;

    const payload = managementTaskToGoogleTask(task, existing);

    if (task.googleTaskId && existing) {
      await updateGoogleTask(taskListId, task.googleTaskId, payload);
      return task;
    }

    const created = await createGoogleTask(taskListId, payload);
    if (!created.id) return task;

    await persistGoogleTaskId(task.id, created.id);
    return { ...task, googleTaskId: created.id };
  } catch (error) {
    console.error("[tasks] Google Tasks sync failed:", error);
    return task;
  }
};

export interface GoogleTasksPullResult {
  pulled: number;
  linked: number;
  skipped: number;
}

export const pullInternalTasksFromGoogle = async (
  userEmail?: string
): Promise<GoogleTasksPullResult> => {
  if (!isGoogleTasksActive()) {
    return { pulled: 0, linked: 0, skipped: 0 };
  }

  if (isPersonalGoogleTasksSync()) {
    if (!userEmail) {
      return { pulled: 0, linked: 0, skipped: 0 };
    }
    return pullInternalTasksForUser(userEmail);
  }

  let taskListId: string;
  let googleTasks;
  try {
    taskListId = await getOrCreateTaskListId();
    googleTasks = await listGoogleTasks(taskListId);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      detail.includes("Domain-wide delegation")
        ? detail
        : `Google Tasks pull failed: ${detail}`
    );
  }
  const localTasks = await listTasks();
  const byGoogleId = new Map(
    localTasks
      .filter((task) => task.googleTaskId)
      .map((task) => [task.googleTaskId as string, task])
  );
  const byAppId = new Map(localTasks.map((task) => [task.id, task]));

  let pulled = 0;
  let linked = 0;
  let skipped = 0;

  for (const googleTask of googleTasks) {
    if (!googleTask.id) {
      skipped += 1;
      continue;
    }

    const appId = parseAppTaskIdFromNotes(googleTask.notes);
    const matched =
      byGoogleId.get(googleTask.id) ??
      (appId ? byAppId.get(appId) : undefined);

    if (!matched || matched.category !== "internal") {
      skipped += 1;
      continue;
    }

    const updated = applyGoogleTaskToManagement(googleTask, {
      ...matched,
      googleTaskId: googleTask.id,
    });

    if (updated.googleTaskId !== matched.googleTaskId) {
      linked += 1;
    }
    if (updated.updatedAt !== matched.updatedAt || updated.completed !== matched.completed) {
      pulled += 1;
    }

    const index = localTasks.findIndex((task) => task.id === matched.id);
    if (index !== -1) {
      localTasks[index] = updated;
      byGoogleId.set(googleTask.id, updated);
      byAppId.set(updated.id, updated);
    }
  }

  await saveTasks(localTasks);
  return { pulled, linked, skipped };
};

export const findStaleGoogleTaskLinks = (
  tasks: ManagementTask[],
  validGoogleTaskIds: ReadonlySet<string>,
  matchers?: string[]
): { cleared: number; next: ManagementTask[] } => {
  let cleared = 0;
  const next = tasks.map((task) => {
    if (
      !shouldSyncTaskToGoogle(task) ||
      !task.googleTaskId ||
      (matchers?.length && !shouldPushTaskToGoogleForUser(task, matchers))
    ) {
      return task;
    }
    if (validGoogleTaskIds.has(task.googleTaskId)) return task;
    cleared += 1;
    return {
      ...task,
      googleTaskId: null,
      updatedAt: new Date().toISOString(),
    };
  });
  return { cleared, next };
};

export const clearStaleGoogleTaskLinks = async (
  userEmail?: string
): Promise<number> => {
  if (!isGoogleTasksActive() || isPersonalGoogleTasksSync()) {
    return 0;
  }

  const matchers = getUserAssigneeMatchers(userEmail);
  const taskListId = await getOrCreateTaskListId();
  let googleTasks;
  try {
    googleTasks = await listGoogleTasks(taskListId);
  } catch (error) {
    if (!isGoogleNotFoundError(error)) throw error;
    return clearGoogleTaskIds(userEmail);
  }

  const validIds = new Set(
    googleTasks.map((task) => task.id).filter((id): id is string => Boolean(id))
  );
  const tasks = await listTasks();
  const { cleared, next } = findStaleGoogleTaskLinks(tasks, validIds, matchers);
  if (cleared > 0) {
    await saveTasks(next);
  }
  return cleared;
};

const isGoogleNotFoundError = (error: unknown): boolean => {
  const err = error as { code?: number; response?: { status?: number } };
  return err.code === 404 || err.response?.status === 404;
};

export const migrateInternalTasksToGoogle = async (
  options?: { dryRun?: boolean },
  userEmail?: string
): Promise<{
  migrated: number;
  skipped: number;
  errors: string[];
  linksCleared: number;
}> => {
  if (!isGoogleTasksActive()) {
    throw new Error(
      "Google Tasks sync is not enabled. Set GOOGLE_TASKS_ENABLED=true and service account credentials."
    );
  }

  if (isPersonalGoogleTasksSync()) {
    if (!userEmail) {
      throw new Error("Connect Google Tasks before pushing tasks.");
    }
    const result = await migrateInternalTasksForUser(userEmail, options);
    return { ...result, linksCleared: 0 };
  }

  const dryRun = options?.dryRun ?? false;
  let linksCleared = 0;
  let taskListId: string;
  try {
    if (!dryRun) {
      linksCleared = await clearStaleGoogleTaskLinks();
    }
    taskListId = await getOrCreateTaskListId();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      detail.includes("Domain-wide delegation")
        ? detail
        : `Google Tasks push failed: ${detail}`
    );
  }
  const tasks = await listTasks();
  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  const matchers = getUserAssigneeMatchers(userEmail);
  for (const task of tasks) {
    if (!shouldSyncTaskToGoogleForUser(task, matchers)) {
      skipped += 1;
      continue;
    }
    if (task.googleTaskId) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      migrated += 1;
      continue;
    }

    try {
      const created = await createGoogleTask(
        taskListId,
        managementTaskToGoogleTask(task)
      );
      if (!created.id) {
        errors.push(`${task.id}: Google API returned no task id`);
        continue;
      }
      const index = tasks.findIndex((row) => row.id === task.id);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          googleTaskId: created.id,
          updatedAt: new Date().toISOString(),
        };
      }
      migrated += 1;
    } catch (error) {
      errors.push(
        `${task.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (!dryRun && migrated > 0) {
    await saveTasks(tasks);
  }

  return { migrated, skipped, errors, linksCleared };
};

export const clearGoogleTaskIds = async (userEmail?: string): Promise<number> => {
  const matchers = getUserAssigneeMatchers(userEmail);
  const tasks = await listTasks();
  let cleared = 0;
  const next = tasks.map((task) => {
    if (!task.googleTaskId) return task;
    if (matchers.length && !shouldPushTaskToGoogleForUser(task, matchers)) {
      return task;
    }
    cleared += 1;
    return {
      ...task,
      googleTaskId: null,
      updatedAt: new Date().toISOString(),
    };
  });
  if (cleared > 0) {
    await saveTasks(next);
  }
  return cleared;
};

export const getGoogleTasksStatus = () => ({
  enabled: isGoogleTasksActive(),
  syncMode: serverGoogleTasksConfig.syncMode,
  personalSync: isPersonalGoogleTasksSync(),
  legacySync: isLegacyGoogleTasksSync(),
  authMode: serverGoogleTasksConfig.authMode,
  delegatedUser: serverGoogleTasksConfig.delegatedUser,
  serviceAccountClientId: serverGoogleTasksConfig.serviceAccountClientId,
  taskListId: serverGoogleTasksConfig.taskListId || null,
  taskListTitle: serverGoogleTasksConfig.taskListTitle,
});
