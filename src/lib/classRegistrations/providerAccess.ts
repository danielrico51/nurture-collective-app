import { createHmac, timingSafeEqual } from "crypto";
import { toAbsoluteUrl } from "@/config/siteUrl";
import type { EventItem } from "@/types/event";

export type ProviderRosterTokenPayload = {
  eventSlug: string;
  instructorEmail: string;
  expiresAt: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getProviderAccessSecret = (): string =>
  process.env.CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET?.trim() ||
  process.env.GIFT_CARD_ORDER_WEBHOOK_SECRET?.trim() ||
  process.env.N8N_WEBHOOK_SECRET?.trim() ||
  "class-registration-provider-access-dev-only";

/** Token remains valid through the class day plus a short grace period. */
export const resolveProviderRosterExpiry = (event: EventItem): string => {
  const [year, month, day] = event.eventDate.split("-").map(Number);
  const expiry = new Date(year, (month ?? 1) - 1, day ?? 1, 23, 59, 59, 999);

  if (event.startTime && event.durationMinutes) {
    const [hours, minutes] = event.startTime.split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const start = new Date(
        year,
        (month ?? 1) - 1,
        day ?? 1,
        hours,
        minutes,
        0,
        0
      );
      start.setMinutes(start.getMinutes() + event.durationMinutes);
      expiry.setTime(start.getTime());
    }
  }

  expiry.setDate(expiry.getDate() + 7);
  return expiry.toISOString();
};

const signPayload = (payloadEncoded: string): string =>
  createHmac("sha256", getProviderAccessSecret())
    .update(payloadEncoded)
    .digest("base64url");

export const createProviderRosterToken = (event: EventItem): string | null => {
  const instructorEmail = event.instructorEmail?.trim();
  if (!instructorEmail) return null;

  const payload: ProviderRosterTokenPayload = {
    eventSlug: event.slug,
    instructorEmail: normalizeEmail(instructorEmail),
    expiresAt: resolveProviderRosterExpiry(event),
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadEncoded}.${signPayload(payloadEncoded)}`;
};

export const verifyProviderRosterToken = (
  token: string
): ProviderRosterTokenPayload | null => {
  const trimmed = token.trim();
  const separator = trimmed.lastIndexOf(".");
  if (separator <= 0) return null;

  const payloadEncoded = trimmed.slice(0, separator);
  const signature = trimmed.slice(separator + 1);
  if (!payloadEncoded || !signature) return null;

  const expected = signPayload(payloadEncoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadEncoded, "base64url").toString("utf8")
    ) as ProviderRosterTokenPayload;

    if (
      !payload?.eventSlug ||
      !payload.instructorEmail ||
      !payload.expiresAt ||
      Number.isNaN(Date.parse(payload.expiresAt))
    ) {
      return null;
    }

    if (Date.parse(payload.expiresAt) < Date.now()) {
      return null;
    }

    return {
      eventSlug: payload.eventSlug,
      instructorEmail: normalizeEmail(payload.instructorEmail),
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
};

export const buildProviderRosterUrl = (event: EventItem): string | null => {
  const token = createProviderRosterToken(event);
  if (!token) return null;
  return toAbsoluteUrl(`/provider/classes/${encodeURIComponent(token)}`);
};

export const instructorEmailMatchesEvent = (
  event: EventItem,
  instructorEmail: string
): boolean =>
  normalizeEmail(event.instructorEmail ?? "") === normalizeEmail(instructorEmail);
