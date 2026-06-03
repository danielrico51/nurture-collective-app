import { randomUUID } from "crypto";
import {
  journalEntryKey,
  journalIndexKey,
  journalProfileKey,
  journalTimelineKey,
  resolveJournalUserKey,
} from "@/lib/journal/keys";
import { readLocalJson, writeLocalJson } from "@/lib/journal/localStorage";
import {
  createEmptyJournalProfile,
  normalizeJournalProfile,
  titlePreview,
  todayDateString,
} from "@/lib/journal/normalize";
import { getJournalStorageMode } from "@/lib/journal/storageMode";
import {
  appendTimelineEvent,
  buildProfileChangeEvents,
  createTimelineStore,
  mergeJournalProfile,
} from "@/lib/journal/timeline";
import { seedJournalProfileFromIntake } from "@/lib/journal/seedFromIntake";
import { readS3ObjectJson, writeS3ObjectJson } from "@/lib/intake/s3Storage";
import type {
  JournalEntry,
  JournalEntryIndex,
  JournalEntryIndexItem,
  JournalEntryInput,
  JournalProfile,
  JournalProfilePatch,
  JournalTimelineStore,
  JourneyTimelineEvent,
} from "@/types/journal";

const readJson = async <T>(key: string): Promise<T | null> =>
  getJournalStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readS3ObjectJson<T>(key);

const writeJson = async (key: string, payload: unknown): Promise<void> => {
  if (getJournalStorageMode() === "local") {
    await writeLocalJson(key, payload);
  } else {
    await writeS3ObjectJson(key, payload);
  }
};

export const getJournalProfile = async (
  userId: string,
  email?: string | null
): Promise<JournalProfile> => {
  const userKey = resolveJournalUserKey(userId, email);
  const key = journalProfileKey(userKey);
  const raw = await readJson<JournalProfile>(key);
  if (raw?.userId) {
    return normalizeJournalProfile(raw, userId);
  }

  const seeded = await seedJournalProfileFromIntake(userId, email);
  if (seeded) {
    await writeJson(key, seeded);
    const timelineKey = journalTimelineKey(userKey);
    const timeline =
      (await readJson<JournalTimelineStore>(timelineKey)) ??
      createTimelineStore(userId);
    const withInit = appendTimelineEvent(timeline, {
      type: "profile_initialized",
      payload: { source: "intake" },
    });
    await writeJson(timelineKey, withInit);
    return seeded;
  }

  const empty = createEmptyJournalProfile(userId);
  await writeJson(key, empty);
  return empty;
};

export const updateJournalProfile = async (
  userId: string,
  patch: JournalProfilePatch,
  email?: string | null
): Promise<{ profile: JournalProfile; timeline: JourneyTimelineEvent[] }> => {
  const userKey = resolveJournalUserKey(userId, email);
  const current = await getJournalProfile(userId, email);
  const merged = mergeJournalProfile(current, patch);
  const events = buildProfileChangeEvents(current, patch, merged);

  await writeJson(journalProfileKey(userKey), merged);

  let timeline =
    (await readJson<JournalTimelineStore>(journalTimelineKey(userKey))) ??
    createTimelineStore(userId);

  for (const event of events) {
    timeline = appendTimelineEvent(timeline, event);
  }
  await writeJson(journalTimelineKey(userKey), timeline);

  return { profile: merged, timeline: timeline.events };
};

export const getJournalTimeline = async (
  userId: string,
  email?: string | null
): Promise<JourneyTimelineEvent[]> => {
  const userKey = resolveJournalUserKey(userId, email);
  const store = await readJson<JournalTimelineStore>(journalTimelineKey(userKey));
  return store?.events ?? [];
};

export const addJournalTimelineEvent = async (
  userId: string,
  input: {
    type: JourneyTimelineEvent["type"];
    payload: Record<string, unknown>;
    occurredAt?: string;
    label?: string;
    note?: string;
  },
  email?: string | null
): Promise<JourneyTimelineEvent[]> => {
  const userKey = resolveJournalUserKey(userId, email);
  const timelineKey = journalTimelineKey(userKey);
  let store =
    (await readJson<JournalTimelineStore>(timelineKey)) ??
    createTimelineStore(userId);

  const payload = { ...input.payload };
  if (input.label) payload.label = input.label;
  if (input.note) payload.note = input.note;

  store = appendTimelineEvent(store, {
    type: input.type,
    payload,
    occurredAt: input.occurredAt,
  });
  await writeJson(timelineKey, store);
  return store.events;
};

const loadEntryIndex = async (
  userKey: string,
  userId: string
): Promise<JournalEntryIndex> => {
  const raw = await readJson<JournalEntryIndex>(journalIndexKey(userKey));
  if (raw?.items) return raw;
  return {
    version: 1,
    userId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
};

const saveEntryIndex = async (
  userKey: string,
  index: JournalEntryIndex
): Promise<void> => {
  await writeJson(journalIndexKey(userKey), {
    ...index,
    updatedAt: new Date().toISOString(),
  });
};

export const listJournalEntries = async (
  userId: string,
  options?: { from?: string; to?: string },
  email?: string | null
): Promise<JournalEntryIndexItem[]> => {
  const userKey = resolveJournalUserKey(userId, email);
  const index = await loadEntryIndex(userKey, userId);
  let items = [...index.items].sort((a, b) =>
    b.journalDate.localeCompare(a.journalDate)
  );
  if (options?.from) {
    items = items.filter((i) => i.journalDate >= options.from!);
  }
  if (options?.to) {
    items = items.filter((i) => i.journalDate <= options.to!);
  }
  return items;
};

export const getJournalEntry = async (
  userId: string,
  entryId: string,
  email?: string | null
): Promise<JournalEntry | null> => {
  const userKey = resolveJournalUserKey(userId, email);
  const entry = await readJson<JournalEntry>(journalEntryKey(userKey, entryId));
  if (!entry || entry.userId !== userId) return null;
  return entry;
};

export const createJournalEntry = async (
  userId: string,
  input: JournalEntryInput,
  email?: string | null
): Promise<JournalEntry> => {
  const userKey = resolveJournalUserKey(userId, email);
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: randomUUID(),
    userId,
    entryType: input.entryType ?? "freeform",
    journalDate: input.journalDate ?? todayDateString(),
    createdAt: now,
    updatedAt: null,
    title: input.title?.trim() || null,
    body: input.body.trim(),
    mood: input.mood ?? null,
    sleepQuality: input.sleepQuality ?? null,
    tags: input.tags ?? [],
    visibility: "private",
    linkedTimelineEventId: null,
    promptId: input.promptId ?? null,
  };

  await writeJson(journalEntryKey(userKey, entry.id), entry);

  const index = await loadEntryIndex(userKey, userId);
  const item: JournalEntryIndexItem = {
    id: entry.id,
    journalDate: entry.journalDate,
    entryType: entry.entryType,
    titlePreview: titlePreview(entry.body, entry.title),
    mood: entry.mood,
    updatedAt: now,
  };
  index.items = [item, ...index.items.filter((i) => i.id !== entry.id)];
  await saveEntryIndex(userKey, index);

  return entry;
};

export const updateJournalEntry = async (
  userId: string,
  entryId: string,
  input: Partial<JournalEntryInput>,
  email?: string | null
): Promise<JournalEntry | null> => {
  const userKey = resolveJournalUserKey(userId, email);
  const existing = await getJournalEntry(userId, entryId, email);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: JournalEntry = {
    ...existing,
    entryType: input.entryType ?? existing.entryType,
    journalDate: input.journalDate ?? existing.journalDate,
    title: input.title !== undefined ? input.title : existing.title,
    body: input.body !== undefined ? input.body.trim() : existing.body,
    mood: input.mood !== undefined ? input.mood : existing.mood,
    sleepQuality:
      input.sleepQuality !== undefined
        ? input.sleepQuality
        : existing.sleepQuality,
    tags: input.tags ?? existing.tags,
    promptId: input.promptId !== undefined ? input.promptId : existing.promptId,
    updatedAt: now,
  };

  await writeJson(journalEntryKey(userKey, entryId), updated);

  const index = await loadEntryIndex(userKey, userId);
  index.items = index.items.map((item) =>
    item.id === entryId
      ? {
          ...item,
          journalDate: updated.journalDate,
          entryType: updated.entryType,
          titlePreview: titlePreview(updated.body, updated.title),
          mood: updated.mood,
          updatedAt: now,
        }
      : item
  );
  await saveEntryIndex(userKey, index);

  return updated;
};

export const deleteJournalEntry = async (
  userId: string,
  entryId: string,
  email?: string | null
): Promise<boolean> => {
  const userKey = resolveJournalUserKey(userId, email);
  const existing = await getJournalEntry(userId, entryId, email);
  if (!existing) return false;

  if (getJournalStorageMode() === "local") {
    const { unlink } = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), ".data", journalEntryKey(userKey, entryId));
    await unlink(filePath).catch(() => undefined);
  } else {
    const { deleteS3Objects } = await import("@/lib/intake/s3Storage");
    await deleteS3Objects([journalEntryKey(userKey, entryId)]);
  }

  const index = await loadEntryIndex(userKey, userId);
  index.items = index.items.filter((i) => i.id !== entryId);
  await saveEntryIndex(userKey, index);
  return true;
};

export const getTodayCheckIn = async (
  userId: string,
  email?: string | null
): Promise<JournalEntry | null> => {
  const today = todayDateString();
  const items = await listJournalEntries(userId, { from: today, to: today }, email);
  const checkIn = items.find((i) => i.entryType === "daily_checkin");
  if (!checkIn) return null;
  return getJournalEntry(userId, checkIn.id, email);
};
