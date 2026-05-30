import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { validateTwilioSignature } from "@/lib/integrations/twilio/signature";

const signRequest = (
  authToken: string,
  url: string,
  params: Record<string, string>
): string => {
  const sortedKeys = Object.keys(params).sort();
  let payload = url;
  for (const key of sortedKeys) {
    payload += key + params[key];
  }
  return crypto.createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
};

describe("validateTwilioSignature", () => {
  it("accepts a valid signature", () => {
    const authToken = "test-auth-token";
    const url = "https://example.com/api/webhooks/twilio/sms";
    const params = { Body: "Hello", From: "+15551234567" };
    const signature = signRequest(authToken, url, params);

    expect(validateTwilioSignature(authToken, signature, url, params)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const url = "https://example.com/api/webhooks/twilio/sms";
    const params = { Body: "Hello", From: "+15551234567" };

    expect(
      validateTwilioSignature("token", "bad-signature", url, params)
    ).toBe(false);
  });
});
