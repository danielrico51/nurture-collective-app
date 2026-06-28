import type { PaymentMethodId } from "@/types/clientService";

export interface PaymentMethodDefinition {
  id: PaymentMethodId;
  label: string;
  /** Admin confirms payment received (Venmo, Zelle). */
  manualConfirmation?: boolean;
  /** Creates a QuickBooks invoice on send. */
  usesQuickBooks?: boolean;
  /** Creates a Stripe checkout session on send. */
  usesStripe?: boolean;
}

export const PAYMENT_METHODS: PaymentMethodDefinition[] = [
  {
    id: "venmo",
    label: "Venmo",
    manualConfirmation: true,
  },
  {
    id: "zelle",
    label: "Zelle",
    manualConfirmation: true,
  },
  {
    id: "quickbooks",
    label: "Debit/Credit/ACH/Bank Wire (QuickBooks)",
    usesQuickBooks: true,
  },
  {
    id: "stripe",
    label: "Stripe",
    usesStripe: true,
  },
];

/** Venmo, Zelle, and QuickBooks — used for service invoices and engagements (not Stripe). */
export const CRM_PAYMENT_METHODS: PaymentMethodDefinition[] =
  PAYMENT_METHODS.filter((method) => method.id !== "stripe");

/** @deprecated alias */
export const SERVICE_INVOICE_PAYMENT_METHODS = CRM_PAYMENT_METHODS;

export const ENGAGEMENT_PAYMENT_METHODS = CRM_PAYMENT_METHODS;

export const isServiceInvoicePaymentMethod = (id: PaymentMethodId): boolean =>
  CRM_PAYMENT_METHODS.some((method) => method.id === id);

export const isEngagementPaymentMethod = (id: PaymentMethodId): boolean =>
  CRM_PAYMENT_METHODS.some((method) => method.id === id);

export const getPaymentMethod = (
  id: PaymentMethodId
): PaymentMethodDefinition | undefined =>
  PAYMENT_METHODS.find((method) => method.id === id);

export const isKnownPaymentMethod = (id: PaymentMethodId): boolean =>
  PAYMENT_METHODS.some((method) => method.id === id);
