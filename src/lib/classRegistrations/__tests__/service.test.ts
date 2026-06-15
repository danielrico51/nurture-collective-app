import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/events/calendar/sync", () => ({
  syncEventToGoogleCalendar: vi.fn(),
}));

vi.mock("@/lib/classRegistrations/storage", () => ({
  listClassRegistrations: vi.fn(),
  readClassRegistration: vi.fn(),
  writeClassRegistration: vi.fn(),
}));

vi.mock("@/lib/events/storage", () => ({
  getEventBySlug: vi.fn(),
}));

import {
  buildClassAvailability,
  countOccupyingRegistrations,
  isOnlineRegistrationEnabled,
  validateRegistrationInput,
  ClassRegistrationValidationError,
} from "@/lib/classRegistrations/service";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

const baseEvent = (overrides: Partial<EventItem> = {}): EventItem => ({
  slug: "childbirth-101",
  title: "Childbirth 101",
  excerpt: "",
  body: "",
  kind: "class",
  format: "In-person",
  eventDate: "2026-06-01",
  listingStatus: "upcoming",
  status: "published",
  registrationMode: "online",
  capacity: 10,
  waitlistEnabled: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const registration = (
  overrides: Partial<ClassRegistration> = {}
): ClassRegistration => ({
  id: "reg-1",
  eventSlug: "childbirth-101",
  eventTitle: "Childbirth 101",
  registrantName: "Jane Doe",
  registrantEmail: "jane@example.com",
  status: "confirmed",
  paymentStatus: "unpaid",
  amountCents: 0,
  source: "website",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  ...overrides,
});

describe("classRegistrations service", () => {
  it("detects online registration mode", () => {
    expect(isOnlineRegistrationEnabled(baseEvent())).toBe(true);
    expect(
      isOnlineRegistrationEnabled(baseEvent({ registrationMode: "contact" }))
    ).toBe(false);
  });

  it("counts confirmed and waitlisted registrations", () => {
    const counts = countOccupyingRegistrations([
      registration({ status: "confirmed" }),
      registration({ id: "reg-2", status: "waitlisted" }),
      registration({ id: "reg-3", status: "cancelled" }),
    ]);

    expect(counts).toEqual({ confirmed: 1, waitlisted: 1 });
  });

  it("builds availability with remaining spots", () => {
    const availability = buildClassAvailability(baseEvent({ capacity: 2 }), [
      registration(),
    ]);

    expect(availability.confirmedCount).toBe(1);
    expect(availability.spotsRemaining).toBe(1);
    expect(availability.registrationOpen).toBe(true);
  });

  it("opens waitlist when class is full", () => {
    const availability = buildClassAvailability(baseEvent({ capacity: 1 }), [
      registration(),
    ]);

    expect(availability.spotsRemaining).toBe(0);
    expect(availability.registrationOpen).toBe(true);
  });

  it("closes registration when full without waitlist", () => {
    const availability = buildClassAvailability(
      baseEvent({ capacity: 1, waitlistEnabled: false }),
      [registration()]
    );

    expect(availability.registrationOpen).toBe(false);
  });

  it("validates registration input", () => {
    expect(() => validateRegistrationInput({})).toThrow(
      ClassRegistrationValidationError
    );
    expect(() =>
      validateRegistrationInput({ registrantName: "Jane", registrantEmail: "bad" })
    ).toThrow("Invalid email address");

    const payload = validateRegistrationInput({
      registrantName: "Jane Doe",
      registrantEmail: "Jane@Example.com",
      registrantPhone: "9735550100",
      notes: "First baby",
    });

    expect(payload.registrantEmail).toBe("jane@example.com");
    expect(payload.registrantPhone).toBe("9735550100");
    expect(payload.source).toBe("website");
  });

  it("accepts google business registration source", () => {
    const payload = validateRegistrationInput({
      registrantName: "Jane Doe",
      registrantEmail: "jane@example.com",
      source: "google_business",
    });

    expect(payload.source).toBe("google_business");
  });
});
