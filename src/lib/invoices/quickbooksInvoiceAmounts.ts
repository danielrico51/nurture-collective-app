import { normalizeStoredInvoiceAmounts } from "@/lib/invoices/processingFee";
import type { ServiceInvoice } from "@/types/clientService";

export interface QuickBooksInvoiceAmounts {
  subtotalCents: number;
  processingFeeCents: number;
  processingFeePercent: number | null;
  amountCents: number;
}

/** Amounts synced to QuickBooks — service subtotal plus optional CRM processing fee line. */
export const resolveQuickBooksInvoiceAmounts = (
  invoice: ServiceInvoice
): QuickBooksInvoiceAmounts => normalizeStoredInvoiceAmounts(invoice);

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

  const lineItems = [
    {
      amount: centsToDollars(amounts.subtotalCents),
      description: input.invoice.description || input.serviceTitle,
      quantity: 1,
      unitPrice: centsToDollars(amounts.subtotalCents),
    },
  ];

  if (amounts.processingFeeCents > 0) {
    lineItems.push({
      amount: centsToDollars(amounts.processingFeeCents),
      description:
        amounts.processingFeePercent != null
          ? `Credit card processing fee (${amounts.processingFeePercent}%)`
          : "Credit card processing fee",
      quantity: 1,
      unitPrice: centsToDollars(amounts.processingFeeCents),
    });
  }

  return lineItems;
};
