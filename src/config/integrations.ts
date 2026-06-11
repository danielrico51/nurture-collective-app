import { brands } from "@/content/site";

/** Twilio toll-free SMS concierge — public for `sms:` links on the site. */
export const getSmsPhoneE164 = (): string =>
  process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER?.trim() ||
  brands.nestingPlace.phoneE164;

export const getSmsPhoneDisplay = (): string => {
  const configured = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER?.trim();
  if (!configured || configured === brands.nestingPlace.phoneE164) {
    return brands.nestingPlace.phone;
  }

  const digits = configured.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return configured;
};

export const buildSmsHref = (body?: string): string => {
  const base = `sms:${getSmsPhoneE164()}`;
  if (!body?.trim()) return base;
  return `${base}?body=${encodeURIComponent(body.trim())}`;
};

/** Public contact email — always the Nesting Place inbox (not legacy Nurture Collective env values). */
export const nestingPlaceContactEmail = brands.nestingPlace.email;

/** Public integration URLs — safe for client components. */
export const integrations = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "",
  contactEmail: nestingPlaceContactEmail,
} as const;

/** Server-only webhook config — use only in API routes. */
export const serverIntegrations = {
  n8nInquiryWebhookUrl: process.env.N8N_INQUIRY_WEBHOOK_URL?.trim() ?? "",
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET?.trim() ?? "",
  n8nTaskSyncWebhookUrl: process.env.N8N_TASK_SYNC_WEBHOOK_URL?.trim() ?? "",
  n8nBillingWebhookUrl: process.env.N8N_BILLING_WEBHOOK_URL?.trim() ?? "",
  /** Team inbox n8n should notify (Gmail/SES nodes). */
  n8nTeamNotificationEmail:
    process.env.N8N_TEAM_NOTIFICATION_EMAIL?.trim() ||
    nestingPlaceContactEmail,
} as const;

export { serverBookingConfig } from "@/config/bookings";

export const buildWhatsAppUrl = (prefilledMessage?: string): string | null => {
  const digits = integrations.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!prefilledMessage?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefilledMessage.trim())}`;
};

export const hasWhatsApp = (): boolean => Boolean(integrations.whatsappNumber);

/** Contact page / CTA WhatsApp card — off until we re-enable chat outreach. */
export const WHATSAPP_CONTACT_CARD_ENABLED = false;

/** @deprecated Use hasBooking from @/config/bookings */
export { hasBooking as hasCalendly } from "@/config/bookings";
