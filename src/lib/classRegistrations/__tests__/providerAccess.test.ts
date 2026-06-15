import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildProviderRosterUrl,
  createProviderRosterToken,
  resolveProviderRosterExpiry,
  verifyProviderRosterToken,
} from "@/lib/classRegistrations/providerAccess";
import type { EventItem } from "@/types/event";

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");
vi.stubEnv("CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET", "test-provider-secret");

const baseEvent = (overrides: Partial<EventItem> = {}): EventItem => ({
  slug: "childbirth-101",
  title: "Childbirth 101",
  excerpt: "",
  body: "",
  kind: "class",
  format: "In-person",
  eventDate: "2026-06-15",
  startTime: "18:30",
  durationMinutes: 120,
  listingStatus: "upcoming",
  status: "published",
  registrationMode: "online",
  instructorName: "Alex Instructor",
  instructorEmail: "Instructor@Example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe("provider roster access tokens", () => {
  it("creates and verifies a signed roster token", () => {
    const token = createProviderRosterToken(baseEvent());
    expect(token).toBeTruthy();

    const payload = verifyProviderRosterToken(token!);
    expect(payload).toMatchObject({
      eventSlug: "childbirth-101",
      instructorEmail: "instructor@example.com",
    });
    expect(payload?.expiresAt).toBeTruthy();
  });

  it("rejects tampered tokens", () => {
    const token = createProviderRosterToken(baseEvent())!;
    const tampered = `${token}x`;
    expect(verifyProviderRosterToken(tampered)).toBeNull();
  });

  it("rejects expired tokens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const token = createProviderRosterToken(baseEvent())!;
    vi.setSystemTime(new Date("2027-01-01T00:00:00.000Z"));
    expect(verifyProviderRosterToken(token)).toBeNull();
  });

  it("returns null when instructor email is missing", () => {
    expect(createProviderRosterToken(baseEvent({ instructorEmail: "" }))).toBeNull();
    expect(buildProviderRosterUrl(baseEvent({ instructorEmail: undefined }))).toBeNull();
  });

  it("builds an absolute provider roster URL", () => {
    const url = buildProviderRosterUrl(baseEvent());
    expect(url).toMatch(
      /^https:\/\/www\.nesting-place\.com\/provider\/classes\/.+/
    );
  });

  it("expires after the class session plus grace period", () => {
    const expiry = resolveProviderRosterExpiry(baseEvent());
    expect(new Date(expiry).getTime()).toBeGreaterThan(
      new Date("2026-06-15T20:30:00").getTime()
    );
  });
});
