import type { CreateEventInput, EventItem, UpdateEventInput } from "@/types/event";
import type { ClassRegistrationAdminSettings } from "@/types/classRegistrationAdmin";

const authHeaders = async (): Promise<HeadersInit> => {
  const { fetchAuthSession } = await import("aws-amplify/auth");
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
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as T;
};

export const fetchAdminEvents = async (seed = false): Promise<{ items: EventItem[] }> => {
  const params = seed ? "?seed=true" : "";
  const response = await fetch(`/api/admin/events${params}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<{ items: EventItem[] }>(response);
};

export const createAdminEvent = async (
  input: CreateEventInput
): Promise<{ item: EventItem }> => {
  const response = await fetch("/api/admin/events", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse<{ item: EventItem }>(response);
};

export const updateAdminEvent = async (
  slug: string,
  input: UpdateEventInput
): Promise<{ item: EventItem }> => {
  const response = await fetch(`/api/admin/events/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse<{ item: EventItem }>(response);
};

export const deleteAdminEvent = async (slug: string): Promise<void> => {
  const response = await fetch(`/api/admin/events/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await handleResponse<{ ok: boolean }>(response);
};

export const syncAdminEventCalendar = async (
  slug: string
): Promise<{ item: EventItem }> => {
  const response = await fetch(
    `/api/admin/events/${encodeURIComponent(slug)}/calendar/sync`,
    {
      method: "POST",
      headers: await authHeaders(),
    }
  );
  return handleResponse<{ item: EventItem }>(response);
};

export const fetchAdminEventsSettings = async (): Promise<{
  settings: ClassRegistrationAdminSettings;
}> => {
  const response = await fetch("/api/admin/events/settings", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<{ settings: ClassRegistrationAdminSettings }>(response);
};
