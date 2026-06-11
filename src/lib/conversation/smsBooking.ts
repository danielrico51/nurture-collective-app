export const BOOK_INTRO_PATH = "/book";

export type SmsBookingLinkOptions = {
  service?: string;
  name?: string;
  email?: string;
  phone?: string;
  conversationSessionId?: string;
};

/** Public site origin for absolute links in SMS replies. */
export const getPublicAppOrigin = (): string => {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://dev.d9588bqvrp5xs.amplifyapp.com";
  return configured.replace(/\/$/, "");
};

/** Deep link to the standalone intro-call booking page (SMS / email). */
export const buildSmsBookingUrl = (options?: SmsBookingLinkOptions): string => {
  const url = new URL(BOOK_INTRO_PATH, getPublicAppOrigin());
  if (options?.service?.trim()) {
    url.searchParams.set("service", options.service.trim());
  }
  if (options?.name?.trim()) {
    url.searchParams.set("name", options.name.trim());
  }
  if (options?.email?.trim()) {
    url.searchParams.set("email", options.email.trim());
  }
  if (options?.phone?.trim()) {
    url.searchParams.set("phone", options.phone.trim());
  }
  if (options?.conversationSessionId?.trim()) {
    url.searchParams.set("session", options.conversationSessionId.trim());
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
  options?: SmsBookingLinkOptions
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
  options?: SmsBookingLinkOptions
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
