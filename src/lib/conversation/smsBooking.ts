import { CARE_START_PATH } from "@/config/carePaths";

/** Public site origin for absolute links in SMS replies. */
export const getPublicAppOrigin = (): string => {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://dev.d9588bqvrp5xs.amplifyapp.com";
  return configured.replace(/\/$/, "");
};

/** Deep link to concierge intake with live scheduling surfaced (Phase 1 SMS booking). */
export const buildSmsBookingUrl = (options?: { service?: string }): string => {
  const url = new URL(CARE_START_PATH, getPublicAppOrigin());
  url.searchParams.set("book", "1");
  if (options?.service?.trim()) {
    url.searchParams.set("service", options.service.trim());
  }
  return url.toString();
};

const BOOKING_INTENT_PATTERN =
  /book|schedule|introductory call|pick a time|calendar|set up (?:for )?a call|available times|get you set up|check for available|moment to check/i;

export const shouldAttachSmsBookingLink = (
  userMessage: string,
  assistantReply: string
): boolean => BOOKING_INTENT_PATTERN.test(`${userMessage}\n${assistantReply}`);

/** Append the booking deep link when scheduling is ready and the reply omits it. */
export const ensureSmsBookingLink = (
  reply: string,
  options?: { service?: string }
): string => {
  const bookingUrl = buildSmsBookingUrl(options);
  if (reply.includes(bookingUrl)) {
    return reply;
  }
  return `${reply.trim()}\n\nBook your intro call: ${bookingUrl}`.trim();
};

export const attachSmsBookingLinkIfNeeded = (
  reply: string,
  userMessage: string,
  options?: { service?: string }
): string => {
  const bookingUrl = buildSmsBookingUrl(options);
  if (reply.includes(bookingUrl)) {
    return reply;
  }
  if (!shouldAttachSmsBookingLink(userMessage, reply)) {
    return reply;
  }
  return ensureSmsBookingLink(reply, options);
};
