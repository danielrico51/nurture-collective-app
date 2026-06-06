/**
 * Booking / scheduling provider abstraction.
 *
 * Production uses Google Workspace appointment schedules (embedded iframe).
 * Calendly remains available as fallback via NEXT_PUBLIC_CALENDLY_URL.
 */

/** Public Google Calendar appointment schedule for The Nesting Place. */
export const DEFAULT_GOOGLE_BOOKING_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3Q0wMuGu20kSp9Vqk7iNhSc8QBEeT4nZGIBLSvCGtlXiP19t27By7jJa0y77koQzPRYRTdhAuL?gv=true";

export type BookingProvider = "calendly" | "google" | "none";

export type BookingProviderSetting = "auto" | BookingProvider;

/** In-page anchor for booking embed sections. */
export const BOOKING_ANCHOR_ID = "book-appointment";

/** @deprecated Use BOOKING_ANCHOR_ID — kept for existing links. */
export const LEGACY_CALENDLY_ANCHOR_ID = "calendly";

const readProviderSetting = (): BookingProviderSetting => {
  const raw = process.env.NEXT_PUBLIC_BOOKING_PROVIDER?.trim().toLowerCase();
  if (raw === "calendly" || raw === "google" || raw === "auto") return raw;
  return "google";
};

/** Client-safe booking URLs and provider selection. */
export const bookingConfig = {
  providerSetting: readProviderSetting(),
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() ?? "",
  googleBookingUrl:
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL?.trim() ||
    DEFAULT_GOOGLE_BOOKING_URL,
} as const;

export const resolveBookingProvider = (): BookingProvider =>
  bookingConfig.googleBookingUrl ? "google" : "none";

export const getActiveBookingUrl = (): string | null =>
  bookingConfig.googleBookingUrl || null;

export const hasBooking = (): boolean => Boolean(getActiveBookingUrl());

export const getBookingProviderLabel = (): string => {
  switch (resolveBookingProvider()) {
    case "google":
      return "Google Calendar";
    case "calendly":
      return "Calendly";
    default:
      return "Scheduling";
  }
};

export const buildBookingEmbedUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("gv")) {
      parsed.searchParams.set("gv", "true");
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

export interface BookingPrefill {
  name?: string;
  email?: string;
}

/** Build a booking URL with optional guest prefill (provider-dependent). */
export const buildBookingUrlWithPrefill = (
  prefill: BookingPrefill = {}
): string | null => {
  const base = getActiveBookingUrl();
  if (!base) return null;

  return base;
};

export const buildBookingPageHref = (path = "/services"): string =>
  `${path}#${BOOKING_ANCHOR_ID}`;

/** Server-only — webhooks and future Google Calendar API credentials. */
export const serverBookingConfig = {
  n8nCalendlyWebhookUrl: process.env.N8N_CALENDLY_WEBHOOK_URL?.trim() ?? "",
  calendlySigningKey: process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() ?? "",
  n8nGoogleBookingsWebhookUrl:
    process.env.N8N_GOOGLE_BOOKINGS_WEBHOOK_URL?.trim() ?? "",
  googleBookingsWebhookSecret:
    process.env.GOOGLE_BOOKINGS_WEBHOOK_SECRET?.trim() ?? "",
  /** Future: service account or OAuth for Google Calendar / Bookings API */
  googleServiceAccountEmail:
    process.env.GOOGLE_BOOKINGS_SERVICE_ACCOUNT_EMAIL?.trim() ?? "",
  googleCalendarId: process.env.GOOGLE_BOOKINGS_CALENDAR_ID?.trim() ?? "",
} as const;
