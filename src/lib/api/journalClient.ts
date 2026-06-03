import type {
  JournalEntry,
  JournalEntryIndexItem,
  JournalEntryInput,
  JournalProfile,
  JournalProfilePatch,
  JourneyTimelineEvent,
  MoodScale,
} from "@/types/journal";
import type { JournalPrompt } from "@/lib/journal/prompts";

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
  const text = await response.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }
  if (!response.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : text.trim().slice(0, 200) ||
            `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
};

export const fetchJournalProfile = async (): Promise<JournalProfile> => {
  const response = await fetch("/api/journal/profile", {
    headers: await authHeaders(),
  });
  const data = await handleResponse<{ profile: JournalProfile }>(response);
  return data.profile;
};

export const patchJournalProfile = async (
  patch: JournalProfilePatch
): Promise<{ profile: JournalProfile; timeline: JourneyTimelineEvent[] }> => {
  const response = await fetch("/api/journal/profile", {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(patch),
  });
  return handleResponse(response);
};

export const fetchJournalTimeline = async (): Promise<JourneyTimelineEvent[]> => {
  const response = await fetch("/api/journal/timeline", {
    headers: await authHeaders(),
  });
  const data = await handleResponse<{ events: JourneyTimelineEvent[] }>(response);
  return data.events;
};

export const createJournalTimelineEvent = async (input: {
  type: JourneyTimelineEvent["type"];
  label?: string;
  note?: string;
  occurredAt?: string;
  imageUrl?: string;
  reminderAt?: string;
  stage?: string;
}): Promise<JourneyTimelineEvent[]> => {
  const response = await fetch("/api/journal/timeline", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      type: input.type,
      label: input.label,
      note: input.note,
      occurredAt: input.occurredAt,
      payload: {
        label: input.label,
        note: input.note,
        imageUrl: input.imageUrl,
        reminderAt: input.reminderAt,
        stage: input.stage,
        kind: input.type === "reminder" ? "reminder" : input.type === "memory" ? "memory" : "milestone",
      },
    }),
  });
  const data = await handleResponse<{ events: JourneyTimelineEvent[] }>(response);
  return data.events;
};

export const fetchJournalEntries = async (params?: {
  from?: string;
  to?: string;
}): Promise<JournalEntryIndexItem[]> => {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  const response = await fetch(`/api/journal/entries${suffix}`, {
    headers: await authHeaders(),
  });
  const data = await handleResponse<{ items: JournalEntryIndexItem[] }>(response);
  return data.items;
};

export const fetchJournalEntry = async (id: string): Promise<JournalEntry> => {
  const response = await fetch(`/api/journal/entries/${encodeURIComponent(id)}`, {
    headers: await authHeaders(),
  });
  const data = await handleResponse<{ entry: JournalEntry }>(response);
  return data.entry;
};

export const createJournalEntry = async (
  input: JournalEntryInput
): Promise<JournalEntry> => {
  const response = await fetch("/api/journal/entries", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ entry: JournalEntry }>(response);
  return data.entry;
};

export const updateJournalEntry = async (
  id: string,
  input: Partial<JournalEntryInput>
): Promise<JournalEntry> => {
  const response = await fetch(`/api/journal/entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ entry: JournalEntry }>(response);
  return data.entry;
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  const response = await fetch(`/api/journal/entries/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await handleResponse(response);
};

export const fetchJournalToday = async (): Promise<{
  checkIn: JournalEntry | null;
  prompt: JournalPrompt;
}> => {
  const response = await fetch("/api/journal/today", {
    headers: await authHeaders(),
  });
  return handleResponse(response);
};

export const MOOD_LABELS: Record<MoodScale, string> = {
  1: "Rough",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};
