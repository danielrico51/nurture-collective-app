import {
  normalizeStoredInvoiceAmounts,
  paymentMethodSupportsProcessingFee,
  resolveInvoiceAmounts,
} from "@/lib/invoices/processingFee";
import type { ServiceInvoice } from "@/types/clientService";

export interface QuickBooksInvoiceAmounts {
  subtotalCents: number;
  processingFeeCents: number;
  processingFeePercent: number | null;
  amountCents: number;
}

/** Amounts sent to QuickBooks — always based on this invoice's subtotal, not the full service. */
export const resolveQuickBooksInvoiceAmounts = (
  invoice: ServiceInvoice
): QuickBooksInvoiceAmounts => {
  const normalized = normalizeStoredInvoiceAmounts(invoice);

  if (
    paymentMethodSupportsProcessingFee(invoice.paymentMethod) &&
    normalized.processingFeePercent != null &&
    normalized.processingFeeCents > 0
  ) {
    return resolveInvoiceAmounts({
      subtotalCents: normalized.subtotalCents,
      applyProcessingFee: true,
      processingFeePercent: normalized.processingFeePercent,
    });
  }

  return normalized;
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

  const lineItems = [
    {
      amount: centsToDollars(amounts.subtotalCents),
      description: input.invoice.description || input.serviceTitle,
      quantity: 1,
      unitPrice: centsToDollars(amounts.subtotalCents),
    },
  ];

  if (amounts.processingFeeCents > 0) {
    const feeLabel =
      amounts.processingFeePercent != null
        ? `Processing fee (${amounts.processingFeePercent}%)`
        : "Processing fee";
    lineItems.push({
      amount: centsToDollars(amounts.processingFeeCents),
      description: feeLabel,
      quantity: 1,
      unitPrice: centsToDollars(amounts.processingFeeCents),
    });
  }

  return lineItems;
};
