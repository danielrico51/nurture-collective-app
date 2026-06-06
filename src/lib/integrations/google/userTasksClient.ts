import { google, type tasks_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { serverGoogleTasksConfig } from "@/config/googleTasks";

const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";

export type GoogleTask = tasks_v1.Schema$Task;

export const createUserOAuthClient = (refreshToken: string): OAuth2Client => {
  const { oauthClientId, oauthClientSecret } = serverGoogleTasksConfig;
  if (!oauthClientId || !oauthClientSecret) {
    throw new Error("Google Tasks OAuth client is not configured");
  }
  const client = new OAuth2Client(oauthClientId, oauthClientSecret);
  client.setCredentials({
    refresh_token: refreshToken,
    scope: TASKS_SCOPE,
  });
  return client;
};

const getUserTasksApi = async (refreshToken: string) => {
  const auth = createUserOAuthClient(refreshToken);
  return google.tasks({
    version: "v1",
    auth: auth as unknown as Parameters<typeof google.tasks>[0]["auth"],
  });
};

export const getOrCreateUserTaskListId = async (
  refreshToken: string,
  existingListId?: string | null
): Promise<string> => {
  const api = await getUserTasksApi(refreshToken);
  const title = serverGoogleTasksConfig.taskListTitle;

  if (existingListId) {
    try {
      const { data } = await api.tasklists.get({ tasklist: existingListId });
      if (data.id) return existingListId;
    } catch (error) {
      const err = error as { code?: number };
      if (err.code !== 404) throw error;
    }
  }

  const { data } = await api.tasklists.list({ maxResults: 100 });
  const found = (data.items ?? []).find((list) => list.title === title);
  if (found?.id) return found.id;

  const created = await api.tasklists.insert({ requestBody: { title } });
  if (!created.data.id) {
    throw new Error("Google Tasks API did not return a task list id");
  }
  return created.data.id;
};

export const createUserGoogleTask = async (
  refreshToken: string,
  taskListId: string,
  task: GoogleTask
): Promise<GoogleTask> => {
  const api = await getUserTasksApi(refreshToken);
  const { data } = await api.tasks.insert({
    tasklist: taskListId,
    requestBody: task,
  });
  return data;
};

export const updateUserGoogleTask = async (
  refreshToken: string,
  taskListId: string,
  taskId: string,
  task: GoogleTask
): Promise<GoogleTask> => {
  const api = await getUserTasksApi(refreshToken);
  const { data } = await api.tasks.update({
    tasklist: taskListId,
    task: taskId,
    requestBody: task,
  });
  return data;
};

export const deleteUserGoogleTask = async (
  refreshToken: string,
  taskListId: string,
  taskId: string
): Promise<void> => {
  const api = await getUserTasksApi(refreshToken);
  await api.tasks.delete({ tasklist: taskListId, task: taskId });
};

export const listUserGoogleTasks = async (
  refreshToken: string,
  taskListId: string
): Promise<GoogleTask[]> => {
  const api = await getUserTasksApi(refreshToken);
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

export const getUserGoogleTask = async (
  refreshToken: string,
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> => {
  const api = await getUserTasksApi(refreshToken);
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
