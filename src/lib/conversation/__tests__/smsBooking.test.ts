import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachSmsBookingLinkIfNeeded,
  buildSmsBookingUrl,
  ensureSmsBookingLink,
  shouldAttachSmsBookingLink,
} from "@/lib/conversation/smsBooking";

describe("buildSmsBookingUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds standalone booking page deep link", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    expect(buildSmsBookingUrl()).toBe("https://example.com/book");
  });

  it("includes prefill params when provided", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    expect(
      buildSmsBookingUrl({
        service: "birth-doula",
        name: "Alex Burleigh",
        email: "alex@example.com",
        conversationSessionId: "sess-123",
      })
    ).toBe(
      "https://example.com/book?service=birth-doula&name=Alex+Burleigh&email=alex%40example.com&session=sess-123"
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
    expect(
      shouldAttachSmsBookingLink(
        "No phone",
        "Let's get you set up for a call. Please give me a moment to check for available times."
      )
    ).toBe(true);
    expect(shouldAttachSmsBookingLink("Third trimester", "Tell me more")).toBe(
      false
    );
  });
});

describe("ensureSmsBookingLink", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("always appends the booking URL when missing", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    const reply = ensureSmsBookingLink(
      "Now let's get you set up for a call. Please give me a moment to check for available times."
    );
    expect(reply).toContain("https://example.com/book");
    expect(reply).toContain("Book your intro call:");
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
    expect(reply).toContain("https://example.com/book");
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
