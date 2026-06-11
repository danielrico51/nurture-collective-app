import { describe, expect, it } from "vitest";
import { parseEmailFromHeader } from "@/lib/email/parseFrom";
import { resolveGiftCardEmailProvider } from "@/lib/email/sendEmail";

describe("parseEmailFromHeader", () => {
  it("parses display name and email", () => {
    expect(parseEmailFromHeader("The Nesting Place <info@nesting-place.com>")).toEqual({
      displayName: "The Nesting Place",
      email: "info@nesting-place.com",
    });
  });

  it("parses bare email", () => {
    expect(parseEmailFromHeader("info@nesting-place.com")).toEqual({
      email: "info@nesting-place.com",
    });
  });
});

describe("resolveGiftCardEmailProvider", () => {
  it("keeps resend when API key is configured", () => {
    expect(resolveGiftCardEmailProvider("resend", true)).toBe("resend");
  });

  it("falls back to ses when resend has no API key", () => {
    expect(resolveGiftCardEmailProvider("resend", false)).toBe("ses");
  });

  it("preserves auto mode", () => {
    expect(resolveGiftCardEmailProvider("auto", true)).toBe("auto");
  });
});
