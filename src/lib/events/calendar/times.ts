import type { EventItem } from "@/types/event";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const parseEventStartTime = (
  startTime?: string,
  fallback = "10:00"
): string => {
  const value = startTime?.trim() || fallback;
  return TIME_PATTERN.test(value) ? value : fallback;
};

export const resolveEventDurationMinutes = (event: EventItem): number => {
  if (typeof event.durationMinutes === "number" && event.durationMinutes > 0) {
    return event.durationMinutes;
  }
  return event.kind === "class" ? 120 : 60;
};

export const buildEventSessionBounds = (
  event: EventItem,
  options?: {
    timezone?: string;
    defaultStartTime?: string;
    defaultClassDurationMinutes?: number;
    defaultEventDurationMinutes?: number;
  }
): { startDateTime: string; endDateTime: string; timeZone: string } => {
  const timeZone = options?.timezone ?? "America/New_York";
  const startTime = parseEventStartTime(
    event.startTime,
    options?.defaultStartTime ?? "10:00"
  );
  const durationMinutes =
    typeof event.durationMinutes === "number" && event.durationMinutes > 0
      ? event.durationMinutes
      : event.kind === "class"
        ? (options?.defaultClassDurationMinutes ?? 120)
        : (options?.defaultEventDurationMinutes ?? 60);

  const start = new Date(`${event.eventDate}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const pad = (value: number) => String(value).padStart(2, "0");
  const formatLocal = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

  return {
    startDateTime: formatLocal(start),
    endDateTime: formatLocal(end),
    timeZone,
  };
};

export const shouldSyncEventToCalendar = (event: EventItem): boolean =>
  event.status === "published" &&
  Boolean(event.eventDate?.trim()) &&
  event.listingStatus !== "completed";

/** Remove from Google Calendar only when the session is explicitly finished. */
export const shouldRemoveEventFromCalendar = (event: EventItem): boolean =>
  event.listingStatus === "completed" && Boolean(event.googleCalendarEventId);

export const buildCalendarEventSummary = (event: EventItem): string => {
  const prefix = event.kind === "class" ? "Class" : "Event";
  return `${prefix}: ${event.title}`;
};

export const buildCalendarEventDescription = (
  event: EventItem,
  confirmedCount: number
): string => {
  const lines = [
    `${event.title} — managed by The Nesting Place.`,
    `Listing: /events-and-classes/${event.slug}`,
    event.excerpt ? `Summary: ${event.excerpt}` : null,
    event.location ? `Location: ${event.location}` : null,
    event.format ? `Format: ${event.format}` : null,
    typeof event.capacity === "number"
      ? `Capacity: ${confirmedCount}/${event.capacity}`
      : `Confirmed registrations: ${confirmedCount}`,
    event.instructorName ? `Instructor: ${event.instructorName}` : null,
    event.instructorEmail ? `Instructor email: ${event.instructorEmail}` : null,
  ];
  return lines.filter(Boolean).join("\n");
};
