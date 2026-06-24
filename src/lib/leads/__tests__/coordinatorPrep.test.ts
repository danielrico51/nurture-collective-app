import { describe, expect, it } from "vitest";
import { buildCoordinatorPrepFromSession } from "@/lib/leads/coordinatorPrep";
import type { LeadRecord } from "@/types/lead";
import type { ConversationSession } from "@/types/conversation";
import { createEmptyExtractedProfile } from "@/types/conversation";
import { LEAD_SNAPSHOT_DEFAULTS } from "@/lib/leads/snapshotDefaults";

const baseLead = (overrides: Partial<LeadRecord> = {}): LeadRecord => ({
  leadId: "guest_test",
  userId: "guest_test",
  status: "intake_in_progress",
  name: "Alex Rivera",
  email: "alex@example.com",
  phone: "",
  maternalStage: "pregnant",
  source: "public_intake",
  isGuest: true,
  coordinatorId: "",
  coordinatorEmail: "",
  intakeStatus: null,
  completionScore: 72,
  supportInterests: ["birth-doula", "lactation"],
  challengesSummary: "First baby, feeling anxious about labor",
  locationZip: null,
  ...LEAD_SNAPSHOT_DEFAULTS,
  archivedAt: null,
  conversationSessionId: "session-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("buildCoordinatorPrepFromSession", () => {
  it("builds narrative summary and bullets for coordinators", () => {
    const session: ConversationSession = {
      id: "session-1",
      userId: "guest_test",
      status: "active",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Welcome to The Nesting Place.",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          role: "user",
          content: "I'm pregnant and interested in a birth doula.",
          timestamp: new Date().toISOString(),
        },
      ],
      extractedProfile: {
        ...createEmptyExtractedProfile(),
        maternalStage: "pregnant",
        supportInterests: ["birth-doula"],
        emotionalState: "anxiety",
        challengesFreeText: "First baby nerves",
      },
      quickReplies: [],
      safetyEscalation: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const prep = buildCoordinatorPrepFromSession(baseLead(), session);

    expect(prep.narrativeSummary).toContain("Alex Rivera");
    expect(prep.narrativeSummary).toContain("birth doula support");
    expect(prep.summaryBullets.some((b) => b.includes("Journey stage"))).toBe(true);
    expect(prep.recentMessages).toHaveLength(2);
    expect(prep.emotionalState).toBe("anxiety");
  });
});
