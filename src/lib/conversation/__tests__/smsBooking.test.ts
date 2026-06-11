import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachSmsBookingLinkIfNeeded,
  buildSmsBookingUrl,
  shouldAttachSmsBookingLink,
} from "@/lib/conversation/smsBooking";

describe("buildSmsBookingUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds care start deep link with book=1", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    expect(buildSmsBookingUrl()).toBe(
      "https://example.com/care/start?book=1"
    );
  });

  it("includes service slug when provided", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    expect(buildSmsBookingUrl({ service: "birth-doula" })).toBe(
      "https://example.com/care/start?book=1&service=birth-doula"
    );
  });
});

describe("shouldAttachSmsBookingLink", () => {
  it("detects booking intent in user or assistant text", () => {
    expect(shouldAttachSmsBookingLink("I'd like to book", "Thanks!")).toBe(
      true
    );
    expect(
      shouldAttachSmsBookingLink("Sounds good", "Pick a time for your call")
    ).toBe(true);
    expect(shouldAttachSmsBookingLink("Third trimester", "Tell me more")).toBe(
      false
    );
  });
});

describe("attachSmsBookingLinkIfNeeded", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("appends booking URL when intent is present", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    const reply = attachSmsBookingLinkIfNeeded(
      "Great — you're all set.",
      "Can I schedule a call?"
    );
    expect(reply).toContain("https://example.com/care/start?book=1");
    expect(reply).toContain("Book your intro call:");
  });

  it("does not duplicate when URL is already in the reply", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    const url = buildSmsBookingUrl();
    const reply = attachSmsBookingLinkIfNeeded(
      `Book here: ${url}`,
      "schedule a call"
    );
    expect(reply).toBe(`Book here: ${url}`);
  });
});
