import { describe, expect, it } from "vitest";
import {
  canOfferScheduling,
  computeMissingFields,
  hasContactInfo,
  hasCollectedBookingContactInChat,
  mergeExtractedProfile,
  parseQuickReplyToPatch,
  profileForLlmContext,
  scrubUnverifiedContactFromProfile,
} from "@/lib/conversation/profileMapper";
import type { ConversationMessage } from "@/types/conversation";
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

  it("strips unverified contact before LLM context", () => {
    const profile = mergeExtractedProfile(createEmptyExtractedProfile(), {
      name: "Daniel",
      email: "daniel@example.com",
    });
    const messages: ConversationMessage[] = [
      {
        id: "1",
        role: "user",
        content: "Pregnant",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
    ];

    const scrubbed = scrubUnverifiedContactFromProfile(profile, messages);
    expect(scrubbed.name).toBe("");
    expect(scrubbed.email).toBe("");
    expect(profileForLlmContext(profile, messages).name).toBe("");
  });

  it("does not offer scheduling until name and email appear in user messages", () => {
    const profile = mergeExtractedProfile(createEmptyExtractedProfile(), {
      maternalStage: "pregnant",
      supportInterests: ["birth-doula"],
      name: "Daniel",
      email: "daniel@example.com",
    });
    const earlyMessages: ConversationMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "How far along are you?",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        role: "user",
        content: "Pregnant",
        timestamp: "2026-01-01T00:01:00.000Z",
      },
      {
        id: "3",
        role: "assistant",
        content: "What support are you looking for?",
        timestamp: "2026-01-01T00:02:00.000Z",
      },
      {
        id: "4",
        role: "user",
        content: "What other services do you offer?",
        timestamp: "2026-01-01T00:03:00.000Z",
      },
    ];

    expect(canOfferScheduling(profile, earlyMessages)).toBe(false);
    expect(hasCollectedBookingContactInChat(earlyMessages, profile)).toBe(false);

    const readyMessages: ConversationMessage[] = [
      ...earlyMessages,
      {
        id: "5",
        role: "user",
        content: "My name is Daniel",
        timestamp: "2026-01-01T00:04:00.000Z",
      },
      {
        id: "6",
        role: "user",
        content: "daniel@example.com",
        timestamp: "2026-01-01T00:05:00.000Z",
      },
    ];

    expect(hasCollectedBookingContactInChat(readyMessages, profile)).toBe(true);
    expect(canOfferScheduling(profile, readyMessages)).toBe(true);
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
