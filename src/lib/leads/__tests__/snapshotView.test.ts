import { describe, expect, it } from "vitest";
import { buildClientNotesSummaryFromLead } from "@/lib/leads/snapshotView";
import { LEAD_SNAPSHOT_DEFAULTS } from "@/lib/leads/snapshotDefaults";
import type { LeadRecord } from "@/types/lead";

const baseLead = (overrides: Partial<LeadRecord> = {}): LeadRecord => ({
  leadId: "lead-1",
  userId: "lead-1",
  status: "new",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "5550100",
  maternalStage: null,
  source: "manual_phone",
  isGuest: true,
  coordinatorId: "",
  coordinatorEmail: "",
  intakeStatus: null,
  completionScore: 0,
  supportInterests: [],
  challengesSummary: "Anxious about labor",
  locationZip: "90210",
  archivedAt: null,
  conversationSessionId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...LEAD_SNAPSHOT_DEFAULTS,
  ...overrides,
});

describe("buildClientNotesSummaryFromLead", () => {
  it("combines challenges summary with snapshot lines", () => {
    const summary = buildClientNotesSummaryFromLead(
      baseLead({
        partnerName: "Alex",
        dueDate: "2026-09-01",
        expectedBabyGender: "boy",
        hospitalName: "City Hospital",
        locationAddress: "123 Oak Ave",
        feeQuotedCents: 150000,
        feeQuotedNotes: "Full doula package",
      })
    );

    expect(summary).toContain("Anxious about labor");
    expect(summary).toContain("Partner: Alex");
    expect(summary).toContain("Hospital: City Hospital");
    expect(summary).toContain("Fee quoted:");
    expect(summary).toContain("Full doula package");
  });

  it("includes corporate benefits in client notes summary", () => {
    const summary = buildClientNotesSummaryFromLead(
      baseLead({
        corporateBenefitPlatform: "carrot",
      })
    );

    expect(summary).toContain("Corporate benefits: Carrot");
  });
});
