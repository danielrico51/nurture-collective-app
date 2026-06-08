import { describe, expect, it } from "vitest";
import {
  isAmbiguousQuickReply,
  sanitizeQuickReplies,
} from "@/lib/conversation/quickReplies";

describe("isAmbiguousQuickReply", () => {
  it("flags placeholder and opt-out chips", () => {
    expect(isAmbiguousQuickReply("Prefer not to share ZIP")).toBe(true);
    expect(isAmbiguousQuickReply("My name is [Name]")).toBe(true);
    expect(isAmbiguousQuickReply("Your email")).toBe(true);
    expect(isAmbiguousQuickReply("Skip the zip")).toBe(true);
  });

  it("allows concrete user answers", () => {
    expect(isAmbiguousQuickReply("Third trimester")).toBe(false);
    expect(isAmbiguousQuickReply("Overnight newborn care")).toBe(false);
    expect(isAmbiguousQuickReply("Weekday mornings")).toBe(false);
  });
});

describe("sanitizeQuickReplies", () => {
  it("removes ambiguous chips and deduplicates", () => {
    expect(
      sanitizeQuickReplies([
        "Third trimester",
        "Prefer not to share ZIP",
        "Third trimester",
        "My name is [Name]",
      ])
    ).toEqual(["Third trimester"]);
  });
});
