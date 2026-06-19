import { describe, expect, it } from "vitest";
import { buildDuplicateEventDraft } from "@/lib/events/duplicate";
import type { EventItem } from "@/types/event";

const source: EventItem = {
  slug: "newborn-care-class",
  title: "Newborn Care Class",
  excerpt: "Learn the basics.",
  body: "Details here.",
  kind: "class",
  format: "In-person",
  location: "Northern New Jersey",
  eventDate: "2025-03-01",
  startTime: "10:00",
  durationMinutes: 120,
  listingStatus: "completed",
  status: "published",
  registrationMode: "online",
  capacity: 12,
  waitlistEnabled: true,
  priceCents: 7500,
  providerId: null,
  providerFeeCents: null,
  platformFeeCents: null,
  instructorName: "Jamie",
  instructorEmail: "jamie@example.com",
  faq: [{ question: "What to bring?", answer: "A notebook." }],
  googleCalendarEventId: "abc123",
  googleCalendarHtmlLink: "https://calendar.google.com/event?eid=abc123",
  googleCalendarSyncedAt: "2025-02-01T00:00:00.000Z",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-03-02T00:00:00.000Z",
};

describe("buildDuplicateEventDraft", () => {
  it("copies content into a fresh draft without calendar metadata", () => {
    const draft = buildDuplicateEventDraft(source);

    expect(draft.title).toBe("Newborn Care Class");
    expect(draft.slug).toBe("newborn-care-class");
    expect(draft.status).toBe("draft");
    expect(draft.listingStatus).toBe("upcoming");
    expect(draft.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(draft.eventDate).not.toBe(source.eventDate);
    expect(draft.priceCents).toBe(7500);
    expect(draft.faq).toEqual(source.faq);
    expect(draft).not.toHaveProperty("googleCalendarEventId");
    expect(draft).not.toHaveProperty("googleCalendarHtmlLink");
    expect(draft).not.toHaveProperty("googleCalendarSyncedAt");
  });
});
