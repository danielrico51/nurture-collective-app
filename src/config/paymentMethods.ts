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
    id: "ach",
    label: "ACH / Bank transfer",
    manualConfirmation: true,
  },
  {
    id: "quickbooks",
    label: "QuickBooks (card / debit)",
    usesQuickBooks: true,
  },
  {
    id: "stripe",
    label: "Stripe",
    usesStripe: true,
  },
];

export const getPaymentMethod = (
  id: PaymentMethodId
): PaymentMethodDefinition | undefined =>
  PAYMENT_METHODS.find((method) => method.id === id);

export const isKnownPaymentMethod = (id: PaymentMethodId): boolean =>
  PAYMENT_METHODS.some((method) => method.id === id);
