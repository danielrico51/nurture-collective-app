import { describe, expect, it } from "vitest";
import {
  buildManualLeadRecord,
  buildManualLeadSource,
  ManualLeadValidationError,
  validateManualLeadInput,
} from "@/lib/leads/manualLead";

describe("manualLead", () => {
  it("builds manual source keys", () => {
    expect(buildManualLeadSource("phone")).toBe("manual_phone");
    expect(buildManualLeadSource("provider_referral")).toBe(
      "manual_provider_referral"
    );
  });

  it("validates required fields", () => {
    expect(() => validateManualLeadInput({})).toThrow(ManualLeadValidationError);
    expect(() =>
      validateManualLeadInput({ name: "Jane Doe", channel: "phone" })
    ).toThrow("Phone or email is required");
    expect(() =>
      validateManualLeadInput({
        name: "Jane Doe",
        email: "bad-email",
        channel: "phone",
      })
    ).toThrow("Invalid email address");
    expect(() =>
      validateManualLeadInput({
        name: "Jane Doe",
        phone: "9735550100",
        channel: "invalid",
      })
    ).toThrow("Invalid lead channel");
  });

  it("accepts a valid manual lead payload", () => {
    const payload = validateManualLeadInput({
      name: "Jane Doe",
      phone: "(973) 555-0100",
      email: "jane@example.com",
      channel: "referral",
      maternalStage: "pregnant",
      supportInterests: ["birth-doula"],
      locationZip: "07039",
      notes: "Referred by OB",
      coordinatorId: "coord-1",
    });

    expect(payload.name).toBe("Jane Doe");
    expect(payload.phone).toBe("+19735550100");
    expect(payload.channel).toBe("referral");
    expect(payload.supportInterests).toEqual(["birth-doula"]);
    expect(payload.coordinatorId).toBe("coord-1");
  });

  it("builds a guest lead record assigned to coordinator", () => {
    const payload = validateManualLeadInput({
      name: "Jane Doe",
      phone: "9735550100",
      channel: "phone",
      coordinatorId: "coord-1",
    });

    const lead = buildManualLeadRecord({
      leadId: "lead-123",
      payload,
      coordinator: { id: "coord-1", email: "coord@example.com" },
    });

    expect(lead.leadId).toBe("lead-123");
    expect(lead.userId).toBe("lead-123");
    expect(lead.isGuest).toBe(true);
    expect(lead.status).toBe("new");
    expect(lead.source).toBe("manual_phone");
    expect(lead.coordinatorId).toBe("coord-1");
    expect(lead.coordinatorEmail).toBe("coord@example.com");
  });
});
