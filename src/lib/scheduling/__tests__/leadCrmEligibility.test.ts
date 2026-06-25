import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isPostConversionLeadStatus,
  resolveConsultBookingLeadCrmDecision,
} from "@/lib/scheduling/leadCrmEligibility";

vi.mock("@/lib/clients/storage", () => ({
  findClientByEmail: vi.fn(),
  findClientForMember: vi.fn(),
}));

vi.mock("@/lib/leads/storage", () => ({
  getLeadById: vi.fn(),
}));

import { findClientByEmail, findClientForMember } from "@/lib/clients/storage";
import { getLeadById } from "@/lib/leads/storage";

const mockedFindClientByEmail = vi.mocked(findClientByEmail);
const mockedFindClientForMember = vi.mocked(findClientForMember);
const mockedGetLeadById = vi.mocked(getLeadById);

describe("leadCrmEligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindClientByEmail.mockResolvedValue(null);
    mockedFindClientForMember.mockResolvedValue(null);
    mockedGetLeadById.mockResolvedValue(null);
  });

  it("syncs when email is new to Client CRM", async () => {
    const decision = await resolveConsultBookingLeadCrmDecision({
      userId: "guest-1",
      attendeeEmail: "new@example.com",
    });
    expect(decision).toEqual({ sync: true });
  });

  it("skips when attendee email matches a client", async () => {
    mockedFindClientByEmail.mockResolvedValue({
      clientId: "client-1",
      email: "existing@example.com",
    } as Awaited<ReturnType<typeof findClientByEmail>>);

    const decision = await resolveConsultBookingLeadCrmDecision({
      userId: "guest-1",
      attendeeEmail: "existing@example.com",
    });

    expect(decision).toEqual({
      sync: false,
      reason: "existing_client_email",
      clientId: "client-1",
    });
  });

  it("skips when signed-in member is linked to a client", async () => {
    mockedFindClientForMember.mockResolvedValue({
      clientId: "client-2",
      email: "member@example.com",
    } as Awaited<ReturnType<typeof findClientForMember>>);

    const decision = await resolveConsultBookingLeadCrmDecision({
      userId: "cognito-sub",
      userEmail: "member@example.com",
      cognitoSub: "cognito-sub",
      attendeeEmail: "member@example.com",
    });

    expect(decision).toEqual({
      sync: false,
      reason: "existing_member_client",
      clientId: "client-2",
    });
  });

  it("skips when lead is already converted", async () => {
    mockedGetLeadById.mockResolvedValue({
      leadId: "lead-1",
      userId: "user-1",
      status: "converted_to_member",
    } as Awaited<ReturnType<typeof getLeadById>>);

    const decision = await resolveConsultBookingLeadCrmDecision({
      userId: "user-1",
      attendeeEmail: "member@example.com",
    });

    expect(decision).toEqual({
      sync: false,
      reason: "converted_lead",
      leadId: "lead-1",
    });
  });

  it("syncs for active pipeline leads", async () => {
    mockedGetLeadById.mockResolvedValue({
      leadId: "lead-2",
      userId: "user-2",
      status: "intake_completed",
    } as Awaited<ReturnType<typeof getLeadById>>);

    const decision = await resolveConsultBookingLeadCrmDecision({
      userId: "user-2",
      attendeeEmail: "prospect@example.com",
    });

    expect(decision).toEqual({ sync: true });
  });

  it("flags post-conversion lead statuses", () => {
    expect(isPostConversionLeadStatus("converted_to_member")).toBe(true);
    expect(isPostConversionLeadStatus("intake_completed")).toBe(false);
  });
});
