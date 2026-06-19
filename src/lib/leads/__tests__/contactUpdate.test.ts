import { describe, expect, it } from "vitest";
import {
  LeadContactValidationError,
  validateUpdateLeadContactInput,
} from "@/lib/leads/contactUpdate";

describe("validateUpdateLeadContactInput", () => {
  it("accepts valid contact updates", () => {
    expect(
      validateUpdateLeadContactInput({
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "",
        locationZip: "07450",
        maternalStage: "third_trimester",
        supportInterests: ["postpartum_doula"],
        challengesSummary: "First baby",
      })
    ).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "",
      locationZip: "07450",
      maternalStage: "third_trimester",
      supportInterests: ["postpartum_doula"],
      challengesSummary: "First baby",
    });
  });

  it("requires a name", () => {
    expect(() =>
      validateUpdateLeadContactInput({ name: "", email: "a@b.com" })
    ).toThrow(LeadContactValidationError);
  });

  it("requires phone or email", () => {
    expect(() =>
      validateUpdateLeadContactInput({ name: "Jane", email: "", phone: "" })
    ).toThrow(LeadContactValidationError);
  });
});
