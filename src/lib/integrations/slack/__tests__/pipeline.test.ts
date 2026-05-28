import { describe, expect, it } from "vitest";
import { parseCalendlyConsultBooked } from "@/lib/integrations/slack/calendly";
import {
  shouldNotifyIntakeCompleted,
  shouldNotifyNewLead,
  shouldNotifyOutOfRegion,
  shouldNotifyStatusChange,
} from "@/lib/integrations/slack/pipeline";
import type { LeadRecord } from "@/types/lead";

const baseLead = (overrides: Partial<LeadRecord> = {}): LeadRecord => ({
  leadId: "guest_test",
  userId: "guest_test",
  status: "new",
  name: "",
  email: "",
  phone: "",
  maternalStage: null,
  source: "public_intake",
  isGuest: true,
  coordinatorId: "",
  coordinatorEmail: "",
  intakeStatus: null,
  completionScore: 0,
  supportInterests: [],
  challengesSummary: "",
  locationZip: null,
  archivedAt: null,
  conversationSessionId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("Slack pipeline rules", () => {
  it("notifies when contact info is first captured", () => {
    const previous = baseLead();
    const current = baseLead({
      name: "Alex",
      email: "alex@example.com",
      status: "intake_in_progress",
    });
    expect(shouldNotifyNewLead(previous, current)).toBe(true);
    expect(shouldNotifyNewLead(current, current)).toBe(false);
  });

  it("notifies when intake is submitted", () => {
    const previous = baseLead({
      name: "Alex",
      email: "alex@example.com",
      status: "intake_in_progress",
    });
    const current = baseLead({
      name: "Alex",
      email: "alex@example.com",
      status: "intake_completed",
    });
    expect(
      shouldNotifyIntakeCompleted(previous, current, true)
    ).toBe(true);
  });

  it("notifies on CRM status changes", () => {
    const previous = baseLead({
      name: "Alex",
      email: "alex@example.com",
      status: "intake_completed",
    });
    const current = baseLead({
      name: "Alex",
      email: "alex@example.com",
      status: "consult_scheduled",
    });
    expect(shouldNotifyStatusChange(previous, current)).toBe(true);
  });

  it("notifies when a new out-of-region ZIP is captured", () => {
    const previous = baseLead({
      name: "Alex",
      email: "alex@example.com",
      status: "intake_in_progress",
    });
    const current = baseLead({
      name: "Alex",
      email: "alex@example.com",
      status: "intake_in_progress",
      locationZip: "90210",
    });
    expect(shouldNotifyOutOfRegion(previous, current, "outside")).toBe(true);
    expect(shouldNotifyOutOfRegion(previous, current, "active")).toBe(false);
    expect(
      shouldNotifyOutOfRegion(current, current, "outside")
    ).toBe(false);
  });
});

describe("Calendly webhook parser", () => {
  it("maps invitee.created to consult booked details", () => {
    const details = parseCalendlyConsultBooked({
      event: "invitee.created",
      payload: {
        name: "Jordan Lee",
        email: "jordan@example.com",
        scheduled_event: {
          name: "Discovery call",
          start_time: "2026-05-28T18:00:00.000000Z",
          timezone: "America/New_York",
        },
      },
    });

    expect(details?.inviteeName).toBe("Jordan Lee");
    expect(details?.inviteeEmail).toBe("jordan@example.com");
    expect(details?.eventName).toBe("Discovery call");
  });
});
