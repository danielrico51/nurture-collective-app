import {
  buildClassCalendarEmbedUrl,
  DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID,
} from "@/config/classCalendarConstants";
import {
  isGoogleSchedulingActive,
  serverSchedulingConfig,
} from "@/lib/scheduling/config";

const readEnabled = () => {
  const explicit = process.env.CLASS_EVENTS_CALENDAR_SYNC_ENABLED?.trim();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return isGoogleSchedulingActive();
};

/** Server-only Google Calendar sync for classes and events. */
export const classCalendarConfig = {
  syncEnabled: readEnabled(),
  calendarId:
    process.env.CLASS_EVENTS_GOOGLE_CALENDAR_ID?.trim() ||
    DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID,
  timezone: serverSchedulingConfig.timezone,
  defaultClassDurationMinutes: Number.parseInt(
    process.env.CLASS_EVENTS_DEFAULT_DURATION_MINUTES ?? "120",
    10
  ),
  defaultEventDurationMinutes: Number.parseInt(
    process.env.CLASS_EVENTS_DEFAULT_EVENT_DURATION_MINUTES ?? "60",
    10
  ),
  defaultStartTime:
    process.env.CLASS_EVENTS_DEFAULT_START_TIME?.trim() || "10:00",
} as const;

export const classCalendarEmbedUrl = buildClassCalendarEmbedUrl(
  classCalendarConfig.calendarId,
  classCalendarConfig.timezone
);

export const isClassCalendarSyncEnabled = () =>
  classCalendarConfig.syncEnabled && Boolean(classCalendarConfig.calendarId);

export {
  buildClassCalendarEmbedUrl,
  DEFAULT_CLASS_EVENTS_CALENDAR_EMBED_URL,
  DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID,
} from "@/config/classCalendarConstants";
