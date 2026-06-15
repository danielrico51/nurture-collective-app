import { describe, expect, it } from "vitest";
import {
  buildClassCalendarEmbedUrl,
  DEFAULT_CLASS_EVENTS_CALENDAR_EMBED_URL,
  DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID,
} from "@/config/classCalendarConstants";

describe("class calendar constants", () => {
  it("uses the dedicated classes calendar id", () => {
    expect(DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID).toContain("@group.calendar.google.com");
    expect(DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID).toMatch(/^c_/);
  });

  it("builds the classes calendar embed url", () => {
    const url = buildClassCalendarEmbedUrl(DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID);
    expect(url).toContain("calendar.google.com/calendar/embed");
    expect(url).toContain(encodeURIComponent(DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID));
    expect(url).toContain("America%2FNew_York");
    expect(url).toBe(DEFAULT_CLASS_EVENTS_CALENDAR_EMBED_URL);
  });
});
