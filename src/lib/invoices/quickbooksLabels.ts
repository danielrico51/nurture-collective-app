import type { ServiceInvoiceQuickBooksRef } from "@/types/clientService";

export const formatServiceInvoiceQuickBooksLabel = (
  qb: ServiceInvoiceQuickBooksRef | null | undefined
): string | null => {
  if (!qb) return null;
  if (qb.syncStatus === "failed") return "QuickBooks sync failed";
  if (qb.salesReceiptNumber || qb.salesReceiptId) {
    const doc = qb.salesReceiptNumber || qb.salesReceiptId;
    return `Sales receipt #${doc}`;
  }
  if (qb.invoiceNumber || qb.invoiceId) {
    const doc = qb.invoiceNumber || qb.invoiceId;
    return `Invoice #${doc}`;
  }
  if (qb.syncStatus === "pending") return "QuickBooks pending";
  return null;
};
