import type { JournalProfile } from "@/types/journal";

export const createEmptyJournalProfile = (userId: string): JournalProfile => {
  const now = new Date().toISOString();
  return {
    version: 1,
    userId,
    createdAt: now,
    updatedAt: now,
    maternalStage: null,
    journeyPath: null,
    dueDate: null,
    dueDateSource: null,
    postpartumWeeks: null,
    babyBirthDate: null,
    pregnancyNotes: null,
    displayNameInJournal: null,
    preferences: {
      dailyReminder: false,
      reminderLocalTime: null,
      defaultEntryVisibility: "private",
    },
  };
};

export const normalizeJournalProfile = (
  raw: Partial<JournalProfile> | null,
  userId: string
): JournalProfile => {
  const base = createEmptyJournalProfile(userId);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    version: 1,
    userId,
    preferences: {
      ...base.preferences,
      ...(raw.preferences ?? {}),
      defaultEntryVisibility: "private",
    },
  };
};

export const titlePreview = (body: string, title: string | null): string | null => {
  if (title?.trim()) return title.trim().slice(0, 80);
  const text = body.trim().replace(/\s+/g, " ");
  if (!text) return null;
  return text.slice(0, 80);
};

export const todayDateString = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
