import { normalizeStoredInvoiceAmounts } from "@/lib/invoices/processingFee";
import type { ServiceInvoice } from "@/types/clientService";

export interface QuickBooksInvoiceAmounts {
  subtotalCents: number;
  processingFeeCents: number;
  processingFeePercent: number | null;
  amountCents: number;
}

/**
 * Amounts synced to QuickBooks — service subtotal only.
 * Processing fees are applied by QuickBooks Payments surcharging at checkout,
 * not as a CRM line item (card network rules prohibit both).
 */
export const resolveQuickBooksInvoiceAmounts = (
  invoice: ServiceInvoice
): QuickBooksInvoiceAmounts => {
  const normalized = normalizeStoredInvoiceAmounts(invoice);
  const subtotalCents = normalized.subtotalCents;

  return {
    subtotalCents,
    processingFeeCents: 0,
    processingFeePercent: null,
    amountCents: subtotalCents,
  };
};

export const buildServiceInvoiceQuickBooksLineItems = (input: {
  invoice: ServiceInvoice;
  serviceTitle: string;
}): Array<{
  amount: number;
  description: string;
  quantity: number;
  unitPrice: number;
  itemId?: string;
}> => {
  const amounts = resolveQuickBooksInvoiceAmounts(input.invoice);
  const centsToDollars = (cents: number): number => cents / 100;

  return [
    {
      amount: centsToDollars(amounts.subtotalCents),
      description: input.invoice.description || input.serviceTitle,
      quantity: 1,
      unitPrice: centsToDollars(amounts.subtotalCents),
    },
  ];
};
