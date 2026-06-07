import { describe, expect, it } from "vitest";
import {
  buildLeadArtifactKey,
  parseLeadIdFromKey,
} from "@/lib/leads/paths";
import {
  buildLeadFromSources,
  canTransitionLeadStatus,
  deriveLeadStatus,
  isGuestLead,
} from "@/lib/leads/workflow";

describe("lead workflow", () => {
  it("identifies guest leads", () => {
    expect(isGuestLead("guest_abc")).toBe(true);
    expect(isGuestLead("cognito-sub-123")).toBe(false);
  });

  it("derives status from intake progress", () => {
    expect(deriveLeadStatus({})).toBe("new");
    expect(deriveLeadStatus({ completionScore: 20 })).toBe("intake_in_progress");
    expect(
      deriveLeadStatus({ intakeStatus: "submitted", hasSubmittedIntake: true })
    ).toBe("intake_completed");
    expect(deriveLeadStatus({ intakeStatus: "in-review" })).toBe("qualified");
  });

  it("prioritizes consult_scheduled when a call is booked", () => {
    expect(deriveLeadStatus({ hasConsultScheduled: true })).toBe(
      "consult_scheduled"
    );
    expect(
      deriveLeadStatus({
        hasConsultScheduled: true,
        completionScore: 10,
        currentStatus: "intake_in_progress",
      })
    ).toBe("consult_scheduled");
  });

  it("preserves terminal pipeline statuses", () => {
    expect(
      deriveLeadStatus({
        currentStatus: "consult_scheduled",
        completionScore: 100,
        hasSubmittedIntake: true,
      })
    ).toBe("consult_scheduled");
    expect(
      deriveLeadStatus({ currentStatus: "under_contract", completionScore: 0 })
    ).toBe("under_contract");
    expect(
      deriveLeadStatus({
        currentStatus: "converted_to_member",
        completionScore: 100,
      })
    ).toBe("converted_to_member");
  });

  it("builds a lead record from intake and extracted profile", () => {
    const lead = buildLeadFromSources({
      userId: "guest_test-user",
      extracted: {
        name: "Alex",
        email: "alex@example.com",
        phone: "555-0100",
        maternalStage: "pregnant",
        completionScore: 65,
        supportInterests: ["lactation"],
        challengesFreeText: "Sleep is hard",
      } as never,
      conversationSessionId: "session-1",
    });

    expect(lead.leadId).toBe("guest_test-user");
    expect(lead.status).toBe("intake_in_progress");
    expect(lead.source).toBe("public_intake");
    expect(lead.isGuest).toBe(true);
    expect(lead.supportInterests).toContain("lactation");
    expect(lead.conversationSessionId).toBe("session-1");
  });

  it("marks lead intake completed after submission", () => {
    const lead = buildLeadFromSources({
      userId: "user-123",
      intake: {
        name: "Jordan",
        email: "j@example.com",
        phone: "555-0200",
        maternalStage: "newly-postpartum",
        intakeStatus: "submitted",
        supportInterests: ["postpartum-doula"],
        challengesFreeText: "",
      } as never,
      hasSubmittedIntake: true,
    });

    expect(lead.status).toBe("intake_completed");
    expect(lead.isGuest).toBe(false);
  });

  it("allows valid CRM status transitions", () => {
    expect(canTransitionLeadStatus("new", "intake_in_progress")).toBe(true);
    expect(canTransitionLeadStatus("intake_completed", "consult_scheduled")).toBe(
      true
    );
    expect(canTransitionLeadStatus("proposal_sent", "converted")).toBe(true);
    expect(canTransitionLeadStatus("proposal_sent", "converted_to_member")).toBe(
      true
    );
    expect(canTransitionLeadStatus("proposal_sent", "under_contract")).toBe(true);
    expect(canTransitionLeadStatus("converted_to_member", "qualified")).toBe(false);
    expect(canTransitionLeadStatus("under_contract", "lost")).toBe(true);
    expect(canTransitionLeadStatus("converted", "qualified")).toBe(false);
    expect(canTransitionLeadStatus("lost", "qualified")).toBe(false);
  });
});

describe("lead storage paths", () => {
  it("builds partitioned S3 keys", () => {
    const key = buildLeadArtifactKey(
      "guest_abc",
      "coordinator_notes",
      "note.json",
      new Date("2026-05-27T14:30:00.000Z")
    );
    expect(key).toContain("leads/lead_id=guest_abc/coordinator_notes/");
    expect(key).toContain("note.json");
  });

  it("parses lead id from object key", () => {
    expect(
      parseLeadIdFromKey(
        "leads/lead_id=guest_abc/profile/file_datetime=2026-05-27T14-30-00Z/lead_profile.json"
      )
    ).toBe("guest_abc");
  });
});

describe("intake to CRM workflow", () => {
  it("walks from new guest lead through intake completion", () => {
    let status = deriveLeadStatus({});
    expect(status).toBe("new");

    status = deriveLeadStatus({ completionScore: 10 });
    expect(status).toBe("intake_in_progress");

    status = deriveLeadStatus({
      completionScore: 90,
      intakeStatus: "submitted",
      hasSubmittedIntake: true,
    });
    expect(status).toBe("intake_completed");

    expect(canTransitionLeadStatus(status, "consult_scheduled")).toBe(true);
    status = "consult_scheduled";
    expect(canTransitionLeadStatus(status, "consult_completed")).toBe(true);
    status = "consult_completed";
    expect(canTransitionLeadStatus(status, "proposal_sent")).toBe(true);
  });
});
