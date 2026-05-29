import type { PaymentProviderId } from "@/lib/payments/types";

const readProvider = (): PaymentProviderId => {
  const value = process.env.GIFT_CARD_PAYMENT_PROVIDER?.trim().toLowerCase();
  if (value === "stripe" || value === "square") return value;
  return "stub";
};

/** Server-only gift card + payment configuration. */
export const serverGiftCardConfig = {
  paymentProvider: readProvider(),
  orderWebhookUrl: process.env.GIFT_CARD_ORDER_WEBHOOK_URL?.trim() ?? "",
  orderWebhookSecret: process.env.GIFT_CARD_ORDER_WEBHOOK_SECRET?.trim() ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
} as const;

/** Public hints for the gift card checkout UI. */
export const giftCardCheckoutConfig = {
  paymentsEnabled:
    process.env.NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED?.trim() === "true",
  paymentProviderLabel:
    process.env.NEXT_PUBLIC_GIFT_CARD_PAYMENT_PROVIDER?.trim() || "stub",
} as const;
