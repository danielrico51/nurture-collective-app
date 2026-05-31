import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyQuickBooksWebhookSignature } from "@/lib/integrations/quickbooks/webhooks";

describe("verifyQuickBooksWebhookSignature", () => {
  it("accepts a valid HMAC signature", () => {
    const body = '{"eventNotifications":[]}';
    const verifier = "test-verifier-token";
    const signature = createHmac("sha256", verifier).update(body).digest("base64");

    expect(verifyQuickBooksWebhookSignature(body, signature, verifier)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(
      verifyQuickBooksWebhookSignature('{"eventNotifications":[]}', "bad-signature", "token")
    ).toBe(false);
  });
});
