import type { ServiceInvoice } from "@/types/clientService";

export const invoiceServiceAmountCents = (invoice: ServiceInvoice): number => {
  if (invoice.subtotalCents != null && invoice.subtotalCents > 0) {
    return invoice.subtotalCents;
  }
  const fee = Math.max(0, invoice.processingFeeCents ?? 0);
  return Math.max(0, invoice.amountCents - fee);
};

export const sumPaidInvoiceCents = (invoices: ServiceInvoice[]): number =>
  invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoiceServiceAmountCents(invoice), 0);

export const sumRefundedInvoiceCents = (invoices: ServiceInvoice[]): number =>
  invoices
    .filter((invoice) => invoice.status === "refunded")
    .reduce((sum, invoice) => sum + invoiceServiceAmountCents(invoice), 0);

export const computeServiceBalanceDueCents = (
  totalFeeCents: number,
  invoices: ServiceInvoice[]
): number => {
  const paid = sumPaidInvoiceCents(invoices);
  // Refunded invoices are excluded from `paid`; no extra adjustment needed.
  return Math.max(0, totalFeeCents - paid);
};

export const computeOpenInvoiceCount = (invoices: ServiceInvoice[]): number =>
  invoices.filter((invoice) =>
    ["draft", "sent", "pending_payment"].includes(invoice.status)
  ).length;
