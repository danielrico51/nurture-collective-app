import { describe, expect, it } from "vitest";
import {
  buildCalendarEventSummary,
  buildEventSessionBounds,
  parseEventStartTime,
  shouldSyncEventToCalendar,
} from "@/lib/events/calendar/times";
import type { EventItem } from "@/types/event";

const event = (overrides: Partial<EventItem> = {}): EventItem => ({
  slug: "childbirth-101",
  title: "Childbirth 101",
  excerpt: "Intro class",
  body: "",
  kind: "class",
  format: "In-person",
  eventDate: "2026-06-15",
  startTime: "18:30",
  durationMinutes: 90,
  listingStatus: "upcoming",
  status: "published",
  registrationMode: "online",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("event calendar helpers", () => {
  it("parses start times with fallback", () => {
    expect(parseEventStartTime("09:15")).toBe("09:15");
    expect(parseEventStartTime(undefined, "10:00")).toBe("10:00");
    expect(parseEventStartTime("invalid", "11:00")).toBe("11:00");
  });

  it("builds session bounds from date, time, and duration", () => {
    const bounds = buildEventSessionBounds(event());
    expect(bounds.startDateTime).toBe("2026-06-15T18:30:00");
    expect(bounds.endDateTime).toBe("2026-06-15T20:00:00");
    expect(bounds.timeZone).toBe("America/New_York");
  });

  it("decides when calendar sync should run", () => {
    expect(shouldSyncEventToCalendar(event())).toBe(true);
    expect(shouldSyncEventToCalendar(event({ status: "draft" }))).toBe(false);
    expect(
      shouldSyncEventToCalendar(event({ listingStatus: "completed" }))
    ).toBe(false);
  });

  it("builds calendar summaries", () => {
    expect(buildCalendarEventSummary(event())).toBe("Class: Childbirth 101");
    expect(buildCalendarEventSummary(event({ kind: "event" }))).toBe(
      "Event: Childbirth 101"
    );
  });
});
