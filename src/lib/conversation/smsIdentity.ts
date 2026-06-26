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
