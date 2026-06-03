import { randomUUID } from "crypto";
import type {
  JourneyEventType,
  JourneyTimelineEvent,
  JournalProfile,
  JournalProfilePatch,
  JournalTimelineStore,
} from "@/types/journal";
import type { JourneyPath } from "@/lib/community/journeyStages";
import type { MaternalStage } from "@/types/intake";

export const createTimelineStore = (userId: string): JournalTimelineStore => ({
  version: 1,
  userId,
  events: [],
  updatedAt: new Date().toISOString(),
});

export const appendTimelineEvent = (
  store: JournalTimelineStore,
  event: {
    type: JourneyTimelineEvent["type"];
    payload: Record<string, unknown>;
    id?: string;
    occurredAt?: string;
  }
): JournalTimelineStore => {
  const now = new Date().toISOString();
  const entry: JourneyTimelineEvent = {
    id: event.id ?? randomUUID(),
    userId: store.userId,
    occurredAt: event.occurredAt ?? now,
    type: event.type,
    payload: event.payload,
    createdAt: now,
  };
  return {
    ...store,
    events: [entry, ...store.events].slice(0, 200),
    updatedAt: now,
  };
};

export const buildProfileChangeEvents = (
  previous: JournalProfile,
  patch: JournalProfilePatch,
  merged: JournalProfile
): Array<{
  type: JourneyEventType;
  payload: Record<string, unknown>;
}> => {
  const events: Array<{ type: JourneyEventType; payload: Record<string, unknown> }> =
    [];

  if (
    patch.maternalStage !== undefined &&
    patch.maternalStage !== previous.maternalStage
  ) {
    events.push({
      type: "stage_changed",
      payload: {
        fromStage: previous.maternalStage,
        toStage: patch.maternalStage,
      },
    });
  }

  if (
    patch.journeyPath !== undefined &&
    patch.journeyPath !== previous.journeyPath
  ) {
    events.push({
      type: "journey_path_set",
      payload: {
        journeyPath: patch.journeyPath as JourneyPath,
        from: previous.journeyPath,
      },
    });
  }

  if (patch.dueDate !== undefined && patch.dueDate !== previous.dueDate) {
    events.push({
      type: previous.dueDate ? "due_date_updated" : "due_date_set",
      payload: {
        dueDate: patch.dueDate,
        dueDateSource: merged.dueDateSource,
        from: previous.dueDate,
      },
    });
  }

  if (
    patch.babyBirthDate !== undefined &&
    patch.babyBirthDate !== previous.babyBirthDate &&
    patch.babyBirthDate
  ) {
    events.push({
      type: "baby_born",
      payload: { babyBirthDate: patch.babyBirthDate },
    });
  }

  return events;
};

export const mergeJournalProfile = (
  current: JournalProfile,
  patch: JournalProfilePatch
): JournalProfile => {
  const now = new Date().toISOString();
  return {
    ...current,
    ...patch,
    preferences: patch.preferences
      ? { ...current.preferences, ...patch.preferences }
      : current.preferences,
    updatedAt: now,
  };
};

export const formatStageLabel = (stage: MaternalStage | null): string => {
  if (!stage) return "Journey";
  return stage.replace(/-/g, " ");
};
