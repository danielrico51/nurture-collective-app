import { describe, expect, it } from "vitest";
import { toPublicEventItem } from "@/lib/events/publicEvent";
import type { EventItem } from "@/types/event";

const baseEvent: EventItem = {
  slug: "newborn-care-class",
  title: "Newborn Care Class",
  excerpt: "Learn the basics.",
  body: "Details here.",
  kind: "class",
  format: "In-person",
  eventDate: "2026-03-01",
  listingStatus: "upcoming",
  status: "published",
  priceCents: 7500,
  providerId: "provider-123",
  providerFeeCents: 5000,
  platformFeeCents: 2500,
  instructorName: "Jamie",
  instructorEmail: "jamie@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("toPublicEventItem", () => {
  it("removes admin-only provider and fee split fields", () => {
    const publicItem = toPublicEventItem(baseEvent);

    expect(publicItem.title).toBe("Newborn Care Class");
    expect(publicItem.priceCents).toBe(7500);
    expect(publicItem.instructorName).toBe("Jamie");
    expect("providerId" in publicItem).toBe(false);
    expect("providerFeeCents" in publicItem).toBe(false);
    expect("platformFeeCents" in publicItem).toBe(false);
  });
});
