import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildProposalContext } from "@/lib/proposals/contextBuilder";
import { retrieveProposalExamples } from "@/lib/proposals/library/retrieval";
import type { IntakeProfile } from "@/types/intake";
import type { ProposalContextPackage } from "@/types/proposal";

vi.mock("@/lib/leads/storage", () => ({
  getLeadDetail: vi.fn(),
}));

import { getLeadDetail } from "@/lib/leads/storage";

const mockedGetLeadDetail = vi.mocked(getLeadDetail);

describe("buildProposalContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes lead detail into a proposal context package", async () => {
    mockedGetLeadDetail.mockResolvedValue({
      lead: {
        leadId: "lead-1",
        userId: "user-1",
        name: "Jordan Lee",
        email: "jordan@example.com",
        phone: "+15551234567",
        supportInterests: ["postpartum-doula"],
        challengesSummary: "Needs overnight support",
        maternalStage: "newly-postpartum",
        locationZip: "07030",
        status: "consult_completed",
        source: "website",
        isGuest: true,
        coordinatorId: "",
        coordinatorEmail: "",
        intakeStatus: "submitted",
        completionScore: 80,
        archivedAt: null,
        conversationSessionId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      intakeProfile: {
        id: "intake-1",
        userId: "user-1",
        name: "Jordan Lee",
        email: "jordan@example.com",
        phone: "+15551234567",
        smsConsent: true,
        supportInterests: ["overnight-newborn-care"],
        budgetPreference: "premium",
        challengesFreeText: "First baby, limited family nearby",
        maternalStage: "newly-postpartum",
        locationZip: "07030",
        intakeStatus: "submitted",
        preferredSchedule: {
          days: ["Mon", "Wed"],
          times: ["overnight"],
          modality: "in-person",
          timezone: "America/New_York",
        },
        insuranceInterested: false,
        insuranceProvider: "",
        challenges: [],
        dueDate: null,
        trimester: null,
        postpartumWeeks: 2,
        postpartumMonths: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      } satisfies IntakeProfile,
      notes: [
        {
          id: "note-1",
          leadId: "lead-1",
          type: "call_log",
          body: "Family wants 3 overnight shifts per week.",
          authorId: "coord-1",
          authorEmail: "coord@nesting-place.com",
          createdAt: "2026-01-03T00:00:00.000Z",
        },
      ],
      conversationPrep: {
        sessionId: "sess-1",
        sessionStatus: "completed",
        messageCount: 12,
        updatedAt: "2026-01-03T00:00:00.000Z",
        narrativeSummary: "High-touch postpartum support",
        summaryBullets: ["Overnight care", "Lactation check-ins"],
        emotionalState: null,
        recentMessages: [],
      },
      recommendations: [],
    });

    const context = await buildProposalContext("lead-1");

    expect(context.client_name).toBe("Jordan Lee");
    expect(context.services_requested).toEqual(
      expect.arrayContaining(["postpartum-doula", "overnight-newborn-care"])
    );
    expect(context.budget).toBe("premium");
    expect(context.call_summary).toContain("3 overnight shifts");
    expect(context.recommended_services).toEqual(context.services_requested);
    expect(context.maternal_stage).toBe("newly-postpartum");
  });

  it("throws when the lead does not exist", async () => {
    mockedGetLeadDetail.mockResolvedValue(null);
    await expect(buildProposalContext("missing")).rejects.toThrow("Lead not found");
  });
});

describe("retrieveProposalExamples", () => {
  it("ranks builtin examples by service overlap", async () => {
    const context: ProposalContextPackage = {
      client_name: "Test Client",
      services_requested: ["overnight-newborn-care", "postpartum-doula"],
      budget: "premium",
      family_size: "twins",
      call_summary: "Needs overnight help",
      recommended_services: ["overnight-newborn-care"],
      pricing: { budget: "premium" },
      notes: "",
      maternal_stage: "newly-postpartum",
      support_interests: ["overnight-newborn-care"],
      location: "07030",
    };

    const examples = await retrieveProposalExamples(context, 3);
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.length).toBeLessThanOrEqual(3);
    expect(
      examples.some((entry) =>
        entry.tags.service_types.some((tag) =>
          ["night-nurse", "night_nurse", "postpartum-doula", "postpartum_doula"].includes(
            tag
          )
        )
      )
    ).toBe(true);
  });
});
