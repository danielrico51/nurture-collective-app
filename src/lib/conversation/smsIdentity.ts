import { normalizePhone } from "@/lib/intake/submitService";

const SMS_GUEST_PREFIX = "guest_sms_";

/** Map inbound Twilio `From` to a stable guest user id for conversation storage. */
export const phoneToSmsGuestUserId = (fromPhone: string): string => {
  const e164 = normalizePhone(fromPhone);
  const digits = e164.replace(/\D/g, "");
  return `${SMS_GUEST_PREFIX}${digits || "unknown"}`;
};

export const isSmsGuestUserId = (userId: string): boolean =>
  userId.startsWith(SMS_GUEST_PREFIX);

export const formatPhoneForDisplay = (e164: string): string => {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);
    return `(${area}) ${prefix}-${line}`;
  }
  return e164;
};
