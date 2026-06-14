import { describe, expect, it } from "vitest";
import { getCoordinatorDisplayName } from "@/lib/leads/coordinatorDisplay";
import type { LeadRecord } from "@/types/lead";
import type { TeamMember } from "@/types/teamMember";

const baseLead = (overrides: Partial<LeadRecord> = {}): LeadRecord => ({
  leadId: "lead-1",
  userId: "lead-1",
  status: "new",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  maternalStage: null,
  source: "manual_phone",
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
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const members: TeamMember[] = [
  {
    id: "coord-1",
    label: "Alex Burleigh",
    username: "alex",
    email: "alex@example.com",
  },
];

describe("getCoordinatorDisplayName", () => {
  it("returns Unassigned when no coordinator is set", () => {
    expect(getCoordinatorDisplayName(baseLead(), members)).toBe("Unassigned");
  });

  it("prefers the admin team member label", () => {
    expect(
      getCoordinatorDisplayName(
        baseLead({ coordinatorId: "coord-1", coordinatorEmail: "alex@example.com" }),
        members
      )
    ).toBe("Alex Burleigh");
  });

  it("falls back to stored email when the member list is unavailable", () => {
    expect(
      getCoordinatorDisplayName(
        baseLead({ coordinatorId: "missing", coordinatorEmail: "legacy@example.com" }),
        members
      )
    ).toBe("legacy@example.com");
  });
});
