import { describe, expect, it } from "vitest";
import { phoneToSmsGuestUserId, isSmsGuestUserId } from "@/lib/conversation/smsIdentity";
import { detectSmsKeywordAction } from "@/lib/conversation/smsKeywords";
import { formatAssistantReplyForSms } from "@/lib/conversation/smsFormatting";

describe("phoneToSmsGuestUserId", () => {
  it("maps E.164 phone to stable guest id", () => {
    expect(phoneToSmsGuestUserId("+18449262867")).toBe("guest_sms_18449262867");
    expect(phoneToSmsGuestUserId("8449262867")).toBe("guest_sms_18449262867");
    expect(isSmsGuestUserId("guest_sms_18449262867")).toBe(true);
  });
});

describe("detectSmsKeywordAction", () => {
  it("detects compliance keywords", () => {
    expect(detectSmsKeywordAction("STOP")).toBe("stop");
    expect(detectSmsKeywordAction("start")).toBe("start");
    expect(detectSmsKeywordAction("HELP")).toBe("help");
    expect(detectSmsKeywordAction("I'm pregnant")).toBe(null);
  });
});

describe("formatAssistantReplyForSms", () => {
  it("strips markdown", () => {
    expect(formatAssistantReplyForSms("**Hello** — *welcome*")).toBe(
      "Hello — welcome"
    );
  });
});
