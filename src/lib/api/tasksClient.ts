import { fetchAuthSession } from "aws-amplify/auth";
import type { CreateTaskInput, ManagementTask, UpdateTaskInput } from "@/types/task";
import type { TeamMember } from "@/types/teamMember";

const authHeaders = async (): Promise<HeadersInit> => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed"
    );
  }
  return data as T;
};

export const fetchTasks = async (): Promise<ManagementTask[]> => {
  const response = await fetch("/api/tasks", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  const data = await handleResponse<{ tasks: ManagementTask[] }>(response);
  return data.tasks;
};

export const fetchTeamMembers = async (): Promise<{
  members: TeamMember[];
  partial?: boolean;
  message?: string;
}> => {
  const response = await fetch("/api/tasks/members", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  const data = await handleResponse<{
    members: TeamMember[];
    partial?: boolean;
    message?: string;
  }>(response);
  return data;
};

export const createTask = async (
  input: CreateTaskInput
): Promise<ManagementTask> => {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ task: ManagementTask }>(response);
  return data.task;
};

export const updateTask = async (
  id: string,
  input: UpdateTaskInput
): Promise<ManagementTask> => {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ task: ManagementTask }>(response);
  return data.task;
};

export const deleteTask = async (id: string): Promise<void> => {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await handleResponse<{ ok: boolean }>(response);
};

export interface GoogleTasksConnectionStatus {
  personalSync: boolean;
  connected: boolean;
  email: string;
  syncAllTasks: boolean;
  connectedAt: string | null;
  taskListId: string | null;
}

export interface GoogleTasksSyncResult {
  googleTasks: {
    enabled: boolean;
    syncMode?: "personal" | "legacy";
    personalSync?: boolean;
    legacySync?: boolean;
    delegatedUser: string;
    taskListId: string | null;
    taskListTitle: string;
  };
  migrate?: {
    migrated: number;
    skipped: number;
    errors: string[];
  };
  pull?: {
    pulled: number;
    linked: number;
    skipped: number;
  };
}

export const fetchGoogleTasksStatus = async (): Promise<GoogleTasksSyncResult> => {
  const response = await fetch("/api/tasks/google/sync", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<GoogleTasksSyncResult>(response);
};

export const syncGoogleTasks = async (input?: {
  action?: "pull" | "migrate" | "both";
  dryRun?: boolean;
}): Promise<GoogleTasksSyncResult> => {
  const response = await fetch("/api/tasks/google/sync", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input ?? { action: "both" }),
  });
  return handleResponse<GoogleTasksSyncResult>(response);
};

export const fetchGoogleTasksConnection =
  async (): Promise<GoogleTasksConnectionStatus> => {
    const response = await fetch("/api/tasks/google/connection", {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handleResponse<GoogleTasksConnectionStatus>(response);
  };

export const startGoogleTasksConnect = async (): Promise<{
  authorizeUrl: string;
}> => {
  const response = await fetch("/api/tasks/google/connect", {
    method: "POST",
    headers: await authHeaders(),
  });
  return handleResponse<{ authorizeUrl: string }>(response);
};

export const disconnectGoogleTasks = async (): Promise<void> => {
  const response = await fetch("/api/tasks/google/connection", {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await handleResponse<{ ok: boolean }>(response);
};
