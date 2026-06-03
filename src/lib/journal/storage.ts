import { randomUUID } from "crypto";
import {
  buildJournalUserPrefix,
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
import { readJournalS3Json, writeJournalS3Json } from "@/lib/journal/s3Storage";
import { getJournalStorageMode } from "@/lib/journal/storageMode";
import {
  appendTimelineEvent,
  buildProfileChangeEvents,
  createTimelineStore,
  mergeJournalProfile,
} from "@/lib/journal/timeline";
import { seedJournalProfileFromIntake } from "@/lib/journal/seedFromIntake";
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

/** Pre-fix layout (outside management/*); kept for read fallback only. */
const legacyJournalUserPrefix = (userKey: string) => `journal/v1/users/${userKey}/`;

const legacyKeyForCurrent = (key: string, userKey: string): string | null => {
  const currentPrefix = buildJournalUserPrefix(userKey);
  if (!key.startsWith(currentPrefix)) return null;
  const suffix = key.slice(currentPrefix.length);
  return `${legacyJournalUserPrefix(userKey)}${suffix}`;
};

const readJsonAtKey = async <T>(key: string): Promise<T | null> =>
  getJournalStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readJournalS3Json<T>(key);

const readJson = async <T>(key: string, userKey?: string): Promise<T | null> => {
  const primary = await readJsonAtKey<T>(key);
  if (primary != null || !userKey) return primary;
  const legacyKey = legacyKeyForCurrent(key, userKey);
  if (!legacyKey) return null;
  return readJsonAtKey<T>(legacyKey);
};

const writeJson = async (key: string, payload: unknown): Promise<void> => {
  if (getJournalStorageMode() === "local") {
    await writeLocalJson(key, payload);
  } else {
    await writeJournalS3Json(key, payload);
  }
};

const normalizeEntryIndex = (
  raw: JournalEntryIndex | null,
  userId: string
): JournalEntryIndex => {
  const now = new Date().toISOString();
  if (!raw || !Array.isArray(raw.items)) {
    return { version: 1, userId, items: [], updatedAt: now };
  }
  return {
    version: 1,
    userId: raw.userId || userId,
    items: raw.items.filter(
      (item) => item && typeof item.id === "string" && item.journalDate
    ),
    updatedAt: raw.updatedAt || now,
  };
};

const normalizeTimelineStore = (
  raw: JournalTimelineStore | null,
  userId: string
): JournalTimelineStore => {
  if (!raw || !Array.isArray(raw.events)) {
    return createTimelineStore(userId);
  }
  return {
    version: 1,
    userId: raw.userId || userId,
    events: raw.events,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
};

export const getJournalProfile = async (
  userId: string,
  email?: string | null
): Promise<JournalProfile> => {
  const userKey = resolveJournalUserKey(userId, email);
  const key = journalProfileKey(userKey);
  const raw = await readJson<JournalProfile>(key, userKey);
  if (raw?.userId) {
    return normalizeJournalProfile(raw, userId);
  }

  // Only seed or create when the object is missing — never overwrite on read errors.
  const seeded = await seedJournalProfileFromIntake(userId, email);
  if (seeded) {
    await writeJson(key, seeded);
    const timelineKey = journalTimelineKey(userKey);
    const timeline = normalizeTimelineStore(
      await readJson<JournalTimelineStore>(timelineKey, userKey),
      userId
    );
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

  let timeline = normalizeTimelineStore(
    await readJson<JournalTimelineStore>(journalTimelineKey(userKey), userKey),
    userId
  );

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
  const store = await readJson<JournalTimelineStore>(
    journalTimelineKey(userKey),
    userKey
  );
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
  let store = normalizeTimelineStore(
    await readJson<JournalTimelineStore>(timelineKey, userKey),
    userId
  );

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
  const raw = await readJson<JournalEntryIndex>(journalIndexKey(userKey), userKey);
  return normalizeEntryIndex(raw, userId);
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
  const entry = await readJson<JournalEntry>(
    journalEntryKey(userKey, entryId),
    userKey
  );
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
    body: String(input.body ?? "").trim(),
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
    body:
      input.body !== undefined
        ? String(input.body).trim()
        : existing.body,
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
