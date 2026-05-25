/** Public integration URLs — safe for client components. */
export const integrations = {
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() ?? "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ??
    "hello@nurturecollective.com",
} as const;

/** Server-only webhook config — use only in API routes. */
export const serverIntegrations = {
  n8nInquiryWebhookUrl: process.env.N8N_INQUIRY_WEBHOOK_URL?.trim() ?? "",
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET?.trim() ?? "",
  n8nTaskSyncWebhookUrl: process.env.N8N_TASK_SYNC_WEBHOOK_URL?.trim() ?? "",
  n8nCalendlyWebhookUrl: process.env.N8N_CALENDLY_WEBHOOK_URL?.trim() ?? "",
  calendlySigningKey: process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() ?? "",
} as const;

export const buildWhatsAppUrl = (prefilledMessage?: string): string | null => {
  const digits = integrations.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!prefilledMessage?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefilledMessage.trim())}`;
};

export const hasCalendly = (): boolean => Boolean(integrations.calendlyUrl);
export const hasWhatsApp = (): boolean => Boolean(integrations.whatsappNumber);
