import { describe, expect, it } from "vitest";
import {
  hasLeadSnapshotFields,
  LeadSnapshotValidationError,
  validateUpdateLeadSnapshotInput,
} from "@/lib/leads/snapshotUpdate";

describe("validateUpdateLeadSnapshotInput", () => {
  it("accepts snapshot fields with fee in dollars", () => {
    const result = validateUpdateLeadSnapshotInput({
      name: "Jordan Lee",
      phone: "555-0100",
      partnerName: "Sam",
      dueDate: "2026-08-15",
      expectedBabyGender: "girl",
      hospitalName: "General Hospital",
      locationAddress: "123 Main St",
      locationZip: "90210",
      feeQuotedAmount: "1,250.00",
      feeQuotedNotes: "Birth + postpartum",
    });

    expect(result).toEqual({
      name: "Jordan Lee",
      phone: "+5550100",
      partnerName: "Sam",
      dueDate: "2026-08-15",
      expectedBabyGender: "girl",
      hospitalName: "General Hospital",
      locationAddress: "123 Main St",
      locationZip: "90210",
      feeQuotedCents: 125000,
      feeQuotedNotes: "Birth + postpartum",
    });
  });

  it("requires phone or email when contact fields are included", () => {
    expect(() =>
      validateUpdateLeadSnapshotInput({
        name: "Jordan Lee",
      })
    ).toThrow(LeadSnapshotValidationError);
  });

  it("rejects invalid due dates", () => {
    expect(() =>
      validateUpdateLeadSnapshotInput({
        dueDate: "08/15/2026",
      })
    ).toThrow("Due date must be YYYY-MM-DD");
  });

  it("detects snapshot fields in a payload", () => {
    expect(hasLeadSnapshotFields({ partnerName: "Sam" })).toBe(true);
    expect(hasLeadSnapshotFields({ corporateBenefitPlatform: "carrot" })).toBe(true);
    expect(hasLeadSnapshotFields({ status: "new" })).toBe(false);
  });

  it("accepts corporate benefits platform updates", () => {
    const result = validateUpdateLeadSnapshotInput({
      corporateBenefitPlatform: "maven",
    });

    expect(result).toEqual({
      corporateBenefitPlatform: "maven",
      corporateBenefitNotes: null,
    });
  });

  it("requires a platform name when other is selected", () => {
    expect(() =>
      validateUpdateLeadSnapshotInput({
        corporateBenefitPlatform: "other",
      })
    ).toThrow("Platform name is required when Other is selected");
  });

  it("accepts a fee range in dollars", () => {
    const result = validateUpdateLeadSnapshotInput({
      feeQuotedAmount: "1,200",
      feeQuotedMaxAmount: "1,800",
      feeQuotedNotes: "Birth doula range",
    });

    expect(result).toEqual({
      feeQuotedCents: 120000,
      feeQuotedMaxCents: 180000,
      feeQuotedNotes: "Birth doula range",
    });
  });

  it("rejects a max fee lower than the min fee", () => {
    expect(() =>
      validateUpdateLeadSnapshotInput({
        feeQuotedAmount: "2,000",
        feeQuotedMaxAmount: "1,500",
      })
    ).toThrow("Fee quoted (to) must be greater than or equal to fee quoted (from)");
  });
});
