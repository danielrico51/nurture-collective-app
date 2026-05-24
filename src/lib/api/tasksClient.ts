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

export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  const response = await fetch("/api/tasks/members", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  const data = await handleResponse<{ members: TeamMember[] }>(response);
  return data.members;
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
