import { google, type tasks_v1 } from "googleapis";
import { serverGoogleTasksConfig } from "@/config/googleTasks";
import { createGoogleTasksAuthClient } from "@/lib/integrations/google/auth";

export type GoogleTask = tasks_v1.Schema$Task;
export type GoogleTaskList = tasks_v1.Schema$TaskList;

const getTasksApi = async () => {
  const auth = await createGoogleTasksAuthClient();
  return google.tasks({
    version: "v1",
    auth: auth as unknown as Parameters<typeof google.tasks>[0]["auth"],
  });
};

const isGoogleNotFoundError = (error: unknown): boolean => {
  const err = error as { code?: number; response?: { status?: number } };
  return err.code === 404 || err.response?.status === 404;
};

export const getOrCreateTaskListId = async (): Promise<string> => {
  const configured = serverGoogleTasksConfig.taskListId;
  const api = await getTasksApi();

  if (configured) {
    try {
      const { data } = await api.tasklists.get({ tasklist: configured });
      if (data.id) return configured;
    } catch (error) {
      if (!isGoogleNotFoundError(error)) throw error;
    }
  }

  const { data } = await api.tasklists.list({ maxResults: 100 });
  const existing = (data.items ?? []).find(
    (list) => list.title === serverGoogleTasksConfig.taskListTitle
  );
  if (existing?.id) return existing.id;

  const created = await api.tasklists.insert({
    requestBody: { title: serverGoogleTasksConfig.taskListTitle },
  });
  if (!created.data.id) {
    throw new Error("Google Tasks API did not return a task list id");
  }
  return created.data.id;
};

export const createGoogleTask = async (
  taskListId: string,
  task: GoogleTask
): Promise<GoogleTask> => {
  const api = await getTasksApi();
  const { data } = await api.tasks.insert({
    tasklist: taskListId,
    requestBody: task,
  });
  return data;
};

export const updateGoogleTask = async (
  taskListId: string,
  taskId: string,
  task: GoogleTask
): Promise<GoogleTask> => {
  const api = await getTasksApi();
  const { data } = await api.tasks.update({
    tasklist: taskListId,
    task: taskId,
    requestBody: task,
  });
  return data;
};

export const deleteGoogleTask = async (
  taskListId: string,
  taskId: string
): Promise<void> => {
  const api = await getTasksApi();
  await api.tasks.delete({ tasklist: taskListId, task: taskId });
};

export const listGoogleTasks = async (
  taskListId: string
): Promise<GoogleTask[]> => {
  const api = await getTasksApi();
  const items: GoogleTask[] = [];
  let pageToken: string | undefined;

  do {
    const { data } = await api.tasks.list({
      tasklist: taskListId,
      showCompleted: true,
      showHidden: true,
      maxResults: 100,
      pageToken,
    });
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return items;
};

export const getGoogleTask = async (
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> => {
  const api = await getTasksApi();
  try {
    const { data } = await api.tasks.get({
      tasklist: taskListId,
      task: taskId,
    });
    return data;
  } catch (error) {
    const err = error as { code?: number };
    if (err.code === 404) return null;
    throw error;
  }
};
