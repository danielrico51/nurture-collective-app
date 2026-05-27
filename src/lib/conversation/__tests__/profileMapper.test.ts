import { describe, expect, it } from "vitest";
import {
  computeMissingFields,
  hasContactInfo,
  mergeExtractedProfile,
  parseQuickReplyToPatch,
} from "@/lib/conversation/profileMapper";
import { createEmptyExtractedProfile } from "@/types/conversation";

describe("profile contact requirements", () => {
  it("requires name and at least one contact method", () => {
    const empty = createEmptyExtractedProfile();
    expect(computeMissingFields(empty)).toContain("name");
    expect(computeMissingFields(empty)).toContain("contactInfo");

    const nameOnly = mergeExtractedProfile(empty, { name: "Alex" });
    expect(computeMissingFields(nameOnly)).not.toContain("name");
    expect(computeMissingFields(nameOnly)).toContain("contactInfo");

    const withEmail = mergeExtractedProfile(nameOnly, {
      email: "alex@example.com",
    });
    expect(computeMissingFields(withEmail)).not.toContain("contactInfo");
    expect(hasContactInfo(withEmail)).toBe(true);

    const withPhone = mergeExtractedProfile(nameOnly, { phone: "555-0100" });
    expect(computeMissingFields(withPhone)).not.toContain("contactInfo");
  });

  it("marks profile ready when care needs and contact info are present", () => {
    const profile = mergeExtractedProfile(createEmptyExtractedProfile(), {
      maternalStage: "pregnant",
      supportInterests: ["birth-doula"],
      challengesFreeText: "First baby nerves",
      name: "Jordan",
      email: "jordan@example.com",
    });

    expect(profile.readyToComplete).toBe(true);
    expect(profile.missingFields).not.toContain("contactInfo");
  });

  it("extracts email and phone from free-text replies", () => {
    const base = createEmptyExtractedProfile();
    const emailPatch = parseQuickReplyToPatch(
      "You can reach me at jordan@example.com",
      base
    );
    expect(emailPatch.email).toBe("jordan@example.com");

    const phonePatch = parseQuickReplyToPatch("My number is (555) 123-4567", base);
    expect(phonePatch.phone).toBe("(555)123-4567");
  });
});
