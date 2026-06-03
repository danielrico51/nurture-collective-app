import { formatStageLabel } from "@/lib/journal/timeline";
import type { MaternalStage } from "@/types/intake";
import type {
  JournalEntryIndexItem,
  JournalProfile,
  JourneyTimelineEvent,
} from "@/types/journal";

export type TimelineItemKind =
  | "memory"
  | "reminder"
  | "milestone"
  | "journal"
  | "checkin"
  | "system";

export interface TimelineItem {
  id: string;
  sortAt: string;
  kind: TimelineItemKind;
  title: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  reminderAt?: string;
  stage?: string;
  entryId?: string;
  mood?: number | null;
  rawEvent?: JourneyTimelineEvent;
}

const eventKind = (type: JourneyTimelineEvent["type"]): TimelineItemKind => {
  if (type === "memory") return "memory";
  if (type === "reminder") return "reminder";
  if (
    type === "profile_initialized" ||
    type === "stage_changed" ||
    type === "due_date_set" ||
    type === "due_date_updated" ||
    type === "journey_path_set"
  ) {
    return "system";
  }
  return "milestone";
};

const formatEventTitle = (event: JourneyTimelineEvent): string => {
  const p = event.payload;
  if (typeof p.label === "string" && p.label.trim()) return p.label.trim();

  switch (event.type) {
    case "memory":
      return "A moment to remember";
    case "reminder":
      return "Reminder";
    case "stage_changed":
      return p.toStage
        ? `Started ${formatStageLabel(p.toStage as MaternalStage)}`
        : "New chapter";
    case "due_date_set":
    case "due_date_updated":
      return p.dueDate ? `Due date · ${String(p.dueDate)}` : "Due date saved";
    case "journey_path_set":
      return "Path updated";
    case "baby_born":
      return "Baby arrived";
    case "ivf_milestone":
      return "IVF milestone";
    case "profile_initialized":
      return "Journal started";
    default:
      return event.type.replace(/_/g, " ");
  }
};

export const timelineEventToItem = (event: JourneyTimelineEvent): TimelineItem => {
  const p = event.payload;
  const kind =
    event.type === "memory"
      ? "memory"
      : event.type === "reminder"
        ? "reminder"
        : eventKind(event.type);

  return {
    id: `event-${event.id}`,
    sortAt: event.occurredAt,
    kind,
    title: formatEventTitle(event),
    subtitle:
      typeof p.stage === "string"
        ? formatStageLabel(p.stage as MaternalStage)
        : undefined,
    body: typeof p.note === "string" ? p.note : undefined,
    imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : undefined,
    reminderAt: typeof p.reminderAt === "string" ? p.reminderAt : undefined,
    stage: typeof p.stage === "string" ? p.stage : undefined,
    rawEvent: event,
  };
};

export const entryToTimelineItem = (item: JournalEntryIndexItem): TimelineItem => {
  const isCheckIn = item.entryType === "daily_checkin";
  return {
    id: `entry-${item.id}`,
    sortAt: `${item.journalDate}T12:00:00.000Z`,
    kind: isCheckIn ? "checkin" : "journal",
    title: item.titlePreview ?? (isCheckIn ? "Daily check-in" : "Journal note"),
    entryId: item.id,
    mood: item.mood,
  };
};

export const buildUnifiedTimeline = (
  events: JourneyTimelineEvent[],
  entries: JournalEntryIndexItem[],
  profile: JournalProfile | null
): TimelineItem[] => {
  const linkedEntryIds = new Set(
    events
      .map((e) => e.payload.linkedEntryId)
      .filter((id): id is string => typeof id === "string")
  );

  const items: TimelineItem[] = [
    ...events.map(timelineEventToItem),
    ...entries
      .filter((e) => !linkedEntryIds.has(e.id))
      .map(entryToTimelineItem),
  ];

  items.sort((a, b) => b.sortAt.localeCompare(a.sortAt));
  return items;
};

export const groupTimelineByStage = (
  items: TimelineItem[],
  profile: JournalProfile | null
): { stage: string | null; label: string; items: TimelineItem[] }[] => {
  const chapters: { stage: string | null; label: string; items: TimelineItem[] }[] =
    [];
  let currentStage: string | null = profile?.maternalStage ?? null;

  const stageFromItem = (item: TimelineItem): string | null => {
    if (item.stage) return item.stage;
    if (item.rawEvent?.type === "stage_changed") {
      const to = item.rawEvent.payload.toStage;
      return typeof to === "string" ? to : currentStage;
    }
    return currentStage;
  };

  for (const item of items) {
    const itemStage = stageFromItem(item);
    if (item.rawEvent?.type === "stage_changed" && item.rawEvent.payload.toStage) {
      currentStage = String(item.rawEvent.payload.toStage);
    }

    const label = itemStage
      ? formatStageLabel(itemStage as MaternalStage)
      : "Your journey";

    const last = chapters[chapters.length - 1];
    if (!last || last.stage !== itemStage) {
      chapters.push({
        stage: itemStage,
        label,
        items: [item],
      });
    } else {
      last.items.push(item);
    }
  }

  if (chapters.length === 0) {
    chapters.push({
      stage: profile?.maternalStage ?? null,
      label: profile?.maternalStage
        ? formatStageLabel(profile.maternalStage)
        : "Your journey",
      items: [],
    });
  }

  return chapters;
};
