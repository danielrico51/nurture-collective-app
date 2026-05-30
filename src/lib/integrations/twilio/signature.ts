import crypto from "node:crypto";

/** Validate Twilio webhook `X-Twilio-Signature` (HMAC-SHA1). */
export const validateTwilioSignature = (
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean => {
  if (!authToken || !signature || !url) return false;

  const sortedKeys = Object.keys(params).sort();
  let payload = url;
  for (const key of sortedKeys) {
    payload += key + params[key];
  }

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(payload, "utf8")
    .digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};
