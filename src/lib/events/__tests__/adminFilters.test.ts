import { describe, expect, it } from "vitest";
import { filterAdminEvents, isActiveEvent, isPastEvent } from "@/lib/events/adminFilters";
import type { EventItem } from "@/types/event";

const baseItem = (overrides: Partial<EventItem> = {}): EventItem => ({
  slug: "sample-class",
  title: "Sample Class",
  excerpt: "",
  body: "",
  kind: "class",
  format: "In-person",
  eventDate: "2026-06-01",
  listingStatus: "upcoming",
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("admin event filters", () => {
  it("marks completed and past-date listings as past", () => {
    expect(isPastEvent(baseItem({ listingStatus: "completed" }), "2026-05-24")).toBe(
      true
    );
    expect(isPastEvent(baseItem({ eventDate: "2026-05-01" }), "2026-05-24")).toBe(
      true
    );
    expect(isActiveEvent(baseItem(), "2026-05-24")).toBe(true);
  });

  it("filters by publish status, session, kind, and search", () => {
    const items = [
      baseItem({ slug: "draft-class", title: "Draft Class", status: "draft" }),
      baseItem({
        slug: "past-class",
        title: "Past Class",
        eventDate: "2026-01-01",
        listingStatus: "completed",
      }),
      baseItem({
        slug: "community-event",
        title: "Community Event",
        kind: "event",
        instructorName: "Alex Rivera",
      }),
    ];

    expect(
      filterAdminEvents(items, {
        publishFilter: "draft",
        referenceDate: "2026-05-24",
      })
    ).toHaveLength(1);

    expect(
      filterAdminEvents(items, {
        sessionFilter: "past",
        referenceDate: "2026-05-24",
      })
    ).toEqual([items[1]]);

    expect(
      filterAdminEvents(items, {
        kindFilter: "event",
        referenceDate: "2026-05-24",
      })
    ).toEqual([items[2]]);

    expect(
      filterAdminEvents(items, {
        query: "rivera",
        referenceDate: "2026-05-24",
      })
    ).toEqual([items[2]]);
  });

  it("sorts by event date", () => {
    const items = [
      baseItem({ slug: "later", eventDate: "2026-08-01" }),
      baseItem({ slug: "earlier", eventDate: "2026-04-01" }),
    ];

    expect(
      filterAdminEvents(items, { sortOrder: "date-asc" }).map((item) => item.slug)
    ).toEqual(["earlier", "later"]);
    expect(
      filterAdminEvents(items, { sortOrder: "date-desc" }).map((item) => item.slug)
    ).toEqual(["later", "earlier"]);
  });
});
