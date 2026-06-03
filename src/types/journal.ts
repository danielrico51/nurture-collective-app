import type { MaternalStage } from "@/types/intake";
import type { JourneyPath } from "@/lib/community/journeyStages";

export type JournalEntryType =
  | "freeform"
  | "daily_checkin"
  | "prompt"
  | "milestone";

export type MoodScale = 1 | 2 | 3 | 4 | 5;

export type JourneyEventType =
  | "stage_changed"
  | "due_date_set"
  | "due_date_updated"
  | "journey_path_set"
  | "baby_born"
  | "ivf_milestone"
  | "custom_milestone"
  | "profile_initialized";

export type DueDateSource = "confirmed" | "estimated" | "ivf_clinic" | null;

export interface JournalProfile {
  version: 1;
  userId: string;
  createdAt: string;
  updatedAt: string;
  maternalStage: MaternalStage | null;
  journeyPath: JourneyPath | null;
  dueDate: string | null;
  dueDateSource: DueDateSource;
  postpartumWeeks: number | null;
  babyBirthDate: string | null;
  pregnancyNotes: string | null;
  displayNameInJournal: string | null;
  preferences: {
    dailyReminder: boolean;
    reminderLocalTime: string | null;
    defaultEntryVisibility: "private";
  };
}

export interface JourneyTimelineEvent {
  id: string;
  userId: string;
  occurredAt: string;
  type: JourneyEventType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  entryType: JournalEntryType;
  journalDate: string;
  createdAt: string;
  updatedAt: string | null;
  title: string | null;
  body: string;
  mood: MoodScale | null;
  sleepQuality: MoodScale | null;
  tags: string[];
  visibility: "private";
  linkedTimelineEventId: string | null;
  promptId: string | null;
}

export interface JournalEntryIndexItem {
  id: string;
  journalDate: string;
  entryType: JournalEntryType;
  titlePreview: string | null;
  mood: MoodScale | null;
  updatedAt: string;
}

export interface JournalEntryIndex {
  version: 1;
  userId: string;
  items: JournalEntryIndexItem[];
  updatedAt: string;
}

export interface JournalTimelineStore {
  version: 1;
  userId: string;
  events: JourneyTimelineEvent[];
  updatedAt: string;
}

export type JournalProfilePatch = Partial<
  Pick<
    JournalProfile,
    | "maternalStage"
    | "journeyPath"
    | "dueDate"
    | "dueDateSource"
    | "postpartumWeeks"
    | "babyBirthDate"
    | "pregnancyNotes"
    | "displayNameInJournal"
    | "preferences"
  >
>;

export interface JournalEntryInput {
  entryType?: JournalEntryType;
  journalDate?: string;
  title?: string | null;
  body: string;
  mood?: MoodScale | null;
  sleepQuality?: MoodScale | null;
  tags?: string[];
  promptId?: string | null;
}
