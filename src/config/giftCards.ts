import type { PaymentProviderId } from "@/lib/payments/types";

const readProvider = (): PaymentProviderId => {
  const value = process.env.GIFT_CARD_PAYMENT_PROVIDER?.trim().toLowerCase();
  if (value === "stripe" || value === "square") return value;
  return "stub";
};

const readGiftCardEmailFrom = () => {
  const from = process.env.GIFT_CARD_EMAIL_FROM?.trim() ?? "";
  const displayName =
    process.env.GIFT_CARD_EMAIL_FROM_NAME?.trim() || "The Nesting Place";
  if (!from) return "";
  return `${displayName} <${from}>`;
};

/** Server-only gift card + payment configuration. */
export const serverGiftCardConfig = {
  paymentProvider: readProvider(),
  orderWebhookUrl: process.env.GIFT_CARD_ORDER_WEBHOOK_URL?.trim() ?? "",
  orderWebhookSecret: process.env.GIFT_CARD_ORDER_WEBHOOK_SECRET?.trim() ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  /** Interim: verified personal (or any) address in SES — see docs/platform/gift-cards-payments.md */
  emailEnabled: process.env.GIFT_CARD_EMAIL_ENABLED?.trim() === "true",
  emailFrom: readGiftCardEmailFrom(),
  emailReplyTo:
    process.env.GIFT_CARD_EMAIL_REPLY_TO?.trim() ||
    process.env.GIFT_CARD_EMAIL_FROM?.trim() ||
    "",
  fulfillmentEmail:
    process.env.GIFT_CARD_FULFILLMENT_EMAIL?.trim() ||
    process.env.GIFT_CARD_EMAIL_FROM?.trim() ||
    "",
} as const;

export const hasGiftCardEmailDelivery = () =>
  serverGiftCardConfig.emailEnabled && Boolean(serverGiftCardConfig.emailFrom);

/** Public hints for the gift card checkout UI. */
export const giftCardCheckoutConfig = {
  paymentsEnabled:
    process.env.NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED?.trim() === "true",
  paymentProviderLabel:
    process.env.NEXT_PUBLIC_GIFT_CARD_PAYMENT_PROVIDER?.trim() || "stub",
} as const;
