import { createHmac, timingSafeEqual } from "crypto";

/** Verify Intuit webhook signature (`intuit-signature` header). */
export const verifyQuickBooksWebhookSignature = (
  rawBody: string,
  signatureHeader: string | null,
  verifierToken: string
): boolean => {
  if (!signatureHeader || !verifierToken) return false;

  const expected = createHmac("sha256", verifierToken)
    .update(rawBody)
    .digest("base64");

  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
};
