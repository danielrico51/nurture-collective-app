import { describe, expect, it, vi } from "vitest";
import {
  buildAdminRegistrationAlertEmail,
  buildInstructorRegistrationAlertEmail,
  buildRegistrantConfirmationEmail,
} from "@/lib/classRegistrations/emailContent";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");

const event: EventItem = {
  slug: "childbirth-101",
  title: "Childbirth 101",
  excerpt: "Learn the basics.",
  body: "",
  kind: "class",
  format: "In-person",
  location: "Livingston, NJ",
  eventDate: "2026-06-15",
  startTime: "18:30",
  listingStatus: "upcoming",
  status: "published",
  registrationMode: "online",
  priceCents: 15000,
  instructorName: "Alex Instructor",
  instructorEmail: "instructor@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const registration = (
  overrides: Partial<ClassRegistration> = {}
): ClassRegistration => ({
  id: "reg-abc-123",
  eventSlug: event.slug,
  eventTitle: event.title,
  registrantName: "Jane Doe",
  registrantEmail: "jane@example.com",
  registrantPhone: "(973) 555-0100",
  notes: "First baby",
  status: "confirmed",
  paymentStatus: "unpaid",
  amountCents: 15000,
  source: "website",
  createdAt: "2026-06-01T12:00:00.000Z",
  updatedAt: "2026-06-01T12:00:00.000Z",
  ...overrides,
});

describe("class registration email content", () => {
  it("builds registrant confirmation email", () => {
    const email = buildRegistrantConfirmationEmail(event, registration());

    expect(email.subject).toContain("You're registered");
    expect(email.subject).toContain(event.title);
    expect(email.text).toContain("Jane Doe");
    expect(email.text).toContain("childbirth-101");
    expect(email.text).toContain("$150.00");
    expect(email.text).toContain("info@nesting-place.com");
    expect(email.text).toContain("(201) 623-3629");
    expect(email.html).toContain("Registration confirmed");
  });

  it("builds waitlist confirmation email", () => {
    const email = buildRegistrantConfirmationEmail(
      event,
      registration({ status: "waitlisted" })
    );

    expect(email.subject).toContain("Waitlist confirmation");
    expect(email.text).toContain("waitlist");
    expect(email.html).toContain("Waitlist confirmation");
  });

  it("builds admin alert email", () => {
    const email = buildAdminRegistrationAlertEmail(event, registration());

    expect(email.subject).toContain("New class registration");
    expect(email.text).toContain("Jane Doe");
    expect(email.text).toContain("jane@example.com");
    expect(email.text).toContain("reg-abc-123");
    expect(email.text).toContain("/admin/events");
    expect(email.html).toContain("Open events admin");
  });

  it("builds instructor alert email with roster link", () => {
    const email = buildInstructorRegistrationAlertEmail(event, registration(), {
      rosterUrl: "https://www.nesting-place.com/provider/classes/test-token",
    });

    expect(email.subject).toContain("New registration");
    expect(email.text).toContain("Jane Doe");
    expect(email.text).toContain("jane@example.com");
    expect(email.text).toContain("Payment:");
    expect(email.text).toContain("/provider/classes/test-token");
    expect(email.html).toContain("Open class roster");
  });
});
