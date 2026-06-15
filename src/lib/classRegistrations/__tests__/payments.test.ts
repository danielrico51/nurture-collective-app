import { describe, expect, it } from "vitest";
import {
  buildVenmoPaymentNote,
  buildVenmoPaymentUrl,
  registrationRequiresPayment,
  resolveRegistrationPaymentFields,
} from "@/lib/classRegistrations/payments";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

const event = (priceCents?: number): EventItem => ({
  slug: "childbirth-101",
  title: "Childbirth 101",
  excerpt: "",
  body: "",
  kind: "class",
  format: "In-person",
  eventDate: "2026-06-15",
  listingStatus: "upcoming",
  status: "published",
  registrationMode: "online",
  priceCents,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const registration = (
  overrides: Partial<ClassRegistration> = {}
): ClassRegistration => ({
  id: "reg-abc-12345678",
  eventSlug: "childbirth-101",
  eventTitle: "Childbirth 101",
  registrantName: "Jane Doe",
  registrantEmail: "jane@example.com",
  status: "confirmed",
  paymentStatus: "pending",
  paymentMethod: "stripe",
  amountCents: 15000,
  source: "website",
  createdAt: "2026-06-01T12:00:00.000Z",
  updatedAt: "2026-06-01T12:00:00.000Z",
  ...overrides,
});

describe("class registration payments", () => {
  it("detects when payment is required", () => {
    expect(
      registrationRequiresPayment(registration({ amountCents: 15000, status: "confirmed" }))
    ).toBe(true);
    expect(
      registrationRequiresPayment(registration({ amountCents: 0, status: "confirmed" }))
    ).toBe(false);
    expect(
      registrationRequiresPayment(registration({ amountCents: 15000, status: "waitlisted" }))
    ).toBe(false);
  });

  it("resolves free registration fields", () => {
    const fields = resolveRegistrationPaymentFields({
      event: event(0),
      waitlist: false,
    });

    expect(fields).toEqual({
      amountCents: 0,
      paymentMethod: "free",
      paymentStatus: "unpaid",
    });
  });

  it("allows pay-later registration without a payment method", () => {
    const fields = resolveRegistrationPaymentFields({
      event: event(15000),
      waitlist: false,
    });

    expect(fields).toEqual({
      amountCents: 15000,
      paymentStatus: "unpaid",
    });
  });

  it("builds venmo payment links with note", () => {
    const url = buildVenmoPaymentUrl({
      handle: "TheNestingPlace",
      amountCents: 15000,
      note: buildVenmoPaymentNote(event(15000), registration()),
    });

    expect(url).toContain("account.venmo.com/pay");
    expect(url).toContain("amount=150.00");
    expect(url).toContain("recipients=TheNestingPlace");
    expect(buildVenmoPaymentNote(event(15000), registration())).toContain("reg reg-abc");
  });
});
