import {
  createUserGoogleTask,
  deleteUserGoogleTask,
  getOrCreateUserTaskListId,
  getUserGoogleTask,
  listUserGoogleTasks,
  updateUserGoogleTask,
} from "@/lib/integrations/google/userTasksClient";
import {
  applyGoogleTaskToManagement,
  managementTaskToGoogleTask,
  parseAppTaskIdFromNotes,
  shouldSyncTaskToGoogle,
} from "@/lib/tasks/googleSyncMapping";
import {
  getGoogleTasksConnection,
  listGoogleTasksConnections,
  saveGoogleTasksConnection,
} from "@/lib/tasks/googleConnectionsStorage";
import { listTasks, saveTasks } from "@/lib/tasks/storage";
import {
  getUserAssigneeMatchers,
  shouldPushTaskToGoogleForUser,
  taskAssignedToUser,
} from "@/lib/tasks/utils";
import type { GoogleTasksUserConnection } from "@/types/googleTasksConnection";
import type { ManagementTask } from "@/types/task";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const shouldSyncTaskForConnection = (
  task: ManagementTask,
  connection: GoogleTasksUserConnection
): boolean => {
  if (!shouldSyncTaskToGoogle(task)) return false;
  const matchers = getUserAssigneeMatchers(connection.email);
  return taskAssignedToUser(task, matchers);
};

const getGoogleTaskIdForUser = (
  task: ManagementTask,
  userEmail: string
): string | null => task.googleTaskIdsByUser[userEmail] ?? null;

const withGoogleTaskIdForUser = (
  task: ManagementTask,
  userEmail: string,
  googleTaskId: string | null
): ManagementTask => ({
  ...task,
  googleTaskIdsByUser: googleTaskId
    ? { ...task.googleTaskIdsByUser, [userEmail]: googleTaskId }
    : Object.fromEntries(
        Object.entries(task.googleTaskIdsByUser).filter(
          ([email]) => email !== userEmail
        )
      ),
});

export const syncTaskForConnection = async (
  connection: GoogleTasksUserConnection,
  task: ManagementTask,
  action: "create" | "update" | "delete"
): Promise<ManagementTask> => {
  const userEmail = normalizeEmail(connection.email);
  if (!shouldSyncTaskForConnection(task, connection)) {
    return task;
  }

  const linkedId = getGoogleTaskIdForUser(task, userEmail);
  if (task.completed && !linkedId) {
    return task;
  }
  if (action === "create" && task.completed) {
    return task;
  }

  const taskListId = await getOrCreateUserTaskListId(
    connection.refreshToken,
    connection.taskListId
  );
  if (!connection.taskListId) {
    await saveGoogleTasksConnection({ ...connection, taskListId });
  }

  if (action === "delete") {
    if (linkedId) {
      await deleteUserGoogleTask(
        connection.refreshToken,
        taskListId,
        linkedId
      );
    }
    return withGoogleTaskIdForUser(task, userEmail, null);
  }

  const existing = linkedId
    ? await getUserGoogleTask(connection.refreshToken, taskListId, linkedId)
    : null;
  const payload = managementTaskToGoogleTask(task, existing, userEmail);

  if (linkedId && existing) {
    await updateUserGoogleTask(
      connection.refreshToken,
      taskListId,
      linkedId,
      payload
    );
    return task;
  }

  const created = await createUserGoogleTask(
    connection.refreshToken,
    taskListId,
    payload
  );
  if (!created.id) return task;
  return withGoogleTaskIdForUser(task, userEmail, created.id);
};

export const syncInternalTaskToConnectedUsers = async (
  task: ManagementTask,
  action: "create" | "update" | "delete"
): Promise<ManagementTask> => {
  const connections = await listGoogleTasksConnections();
  if (connections.length === 0) return task;

  let next = task;
  for (const connection of connections) {
    try {
      next = await syncTaskForConnection(connection, next, action);
    } catch (error) {
      console.error(
        `[tasks] Google personal sync failed for ${connection.email}:`,
        error
      );
    }
  }

  if (JSON.stringify(next.googleTaskIdsByUser) !== JSON.stringify(task.googleTaskIdsByUser)) {
    const tasks = await listTasks();
    const index = tasks.findIndex((row) => row.id === task.id);
    if (index !== -1) {
      tasks[index] = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      await saveTasks(tasks);
    }
  }

  return next;
};

export interface GoogleTasksPullResult {
  pulled: number;
  linked: number;
  skipped: number;
}

export const pullInternalTasksForUser = async (
  userEmail: string
): Promise<GoogleTasksPullResult> => {
  const connection = await getGoogleTasksConnection(userEmail);
  if (!connection) {
    return { pulled: 0, linked: 0, skipped: 0 };
  }

  const normalized = normalizeEmail(userEmail);
  const taskListId = await getOrCreateUserTaskListId(
    connection.refreshToken,
    connection.taskListId
  );
  if (!connection.taskListId) {
    await saveGoogleTasksConnection({ ...connection, taskListId });
  }

  const googleTasks = await listUserGoogleTasks(
    connection.refreshToken,
    taskListId
  );
  const localTasks = await listTasks();
  const byGoogleId = new Map(
    localTasks
      .filter((task) => task.googleTaskIdsByUser[normalized])
      .map((task) => [task.googleTaskIdsByUser[normalized] as string, task])
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

    if (!shouldSyncTaskForConnection(matched, connection)) {
      skipped += 1;
      continue;
    }

    const updated = applyGoogleTaskToManagement(googleTask, matched, normalized);
    const previousId = matched.googleTaskIdsByUser[normalized] ?? null;
    if ((updated.googleTaskIdsByUser[normalized] ?? null) !== previousId) {
      linked += 1;
    }
    if (
      updated.updatedAt !== matched.updatedAt ||
      updated.completed !== matched.completed
    ) {
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

/** Drop cached list id so recreate finds or creates "Nesting Place Tasks" again. */
export const resetUserGoogleTaskListId = async (
  userEmail: string
): Promise<void> => {
  const connection = await getGoogleTasksConnection(userEmail);
  if (!connection?.taskListId) return;
  await saveGoogleTasksConnection({ ...connection, taskListId: null });
};

export const migrateInternalTasksForUser = async (
  userEmail: string,
  options?: { dryRun?: boolean }
): Promise<{ migrated: number; skipped: number; errors: string[] }> => {
  const connection = await getGoogleTasksConnection(userEmail);
  if (!connection) {
    throw new Error("Connect Google Tasks before pushing tasks.");
  }

  const dryRun = options?.dryRun ?? false;
  const normalized = normalizeEmail(userEmail);
  const taskListId = await getOrCreateUserTaskListId(
    connection.refreshToken,
    connection.taskListId
  );
  if (!connection.taskListId) {
    await saveGoogleTasksConnection({ ...connection, taskListId });
  }

  const tasks = await listTasks();
  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  const matchers = getUserAssigneeMatchers(connection.email);
  for (const task of tasks) {
    if (!shouldPushTaskToGoogleForUser(task, matchers)) {
      skipped += 1;
      continue;
    }
    if (task.googleTaskIdsByUser[normalized]) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      migrated += 1;
      continue;
    }

    try {
      const created = await createUserGoogleTask(
        connection.refreshToken,
        taskListId,
        managementTaskToGoogleTask(task, null, normalized)
      );
      if (!created.id) {
        errors.push(`${task.id}: Google API returned no task id`);
        continue;
      }
      const index = tasks.findIndex((row) => row.id === task.id);
      if (index !== -1) {
        tasks[index] = withGoogleTaskIdForUser(
          tasks[index],
          normalized,
          created.id
        );
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

  return { migrated, skipped, errors };
};
