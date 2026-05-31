import type { PaymentProviderId } from "@/lib/payments/types";

const readProvider = (): PaymentProviderId => {
  const value = process.env.BILLING_PAYMENT_PROVIDER?.trim().toLowerCase();
  if (value === "stripe" || value === "square") return value;
  return "stub";
};

const DEFAULT_BILLING_BUCKET = "nurture-collective-tasks";

/** Server-only billing + purchase order configuration. */
export const serverBillingConfig = {
  paymentProvider: readProvider(),
  s3Bucket:
    process.env.BILLING_S3_BUCKET?.trim() ||
    process.env.NURTURE_CLIENTS_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_BILLING_BUCKET,
  useLocalStorage:
    process.env.BILLING_USE_LOCAL_STORAGE === "true" ||
    (process.env.NODE_ENV === "development" &&
      !process.env.BILLING_S3_BUCKET?.trim() &&
      !process.env.NURTURE_CLIENTS_BUCKET?.trim() &&
      !process.env.TASKS_S3_BUCKET?.trim()),
} as const;

/** Public hints for the purchases UI. */
export const billingCheckoutConfig = {
  paymentsEnabled:
    process.env.NEXT_PUBLIC_BILLING_PAYMENTS_ENABLED?.trim() === "true",
  paymentProviderLabel:
    process.env.NEXT_PUBLIC_BILLING_PAYMENT_PROVIDER?.trim() || "stub",
} as const;
