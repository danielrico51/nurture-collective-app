import type { ServiceInvoice } from "@/types/clientService";

export const sumPaidInvoiceCents = (invoices: ServiceInvoice[]): number =>
  invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);

export const sumRefundedInvoiceCents = (invoices: ServiceInvoice[]): number =>
  invoices
    .filter((invoice) => invoice.status === "refunded")
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);

export const computeServiceBalanceDueCents = (
  totalFeeCents: number,
  invoices: ServiceInvoice[]
): number => {
  const paid = sumPaidInvoiceCents(invoices);
  const refunded = sumRefundedInvoiceCents(invoices);
  return Math.max(0, totalFeeCents - paid + refunded);
};

export const computeOpenInvoiceCount = (invoices: ServiceInvoice[]): number =>
  invoices.filter((invoice) =>
    ["draft", "sent", "pending_payment"].includes(invoice.status)
  ).length;
