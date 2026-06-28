import "server-only";

import { isQuickBooksOAuthConfigured } from "@/config/quickbooks";
import {
  findQuickBooksInvoiceByDocNumber,
  getQuickBooksInvoice,
  resolveQuickBooksInvoicePaymentLink,
} from "@/lib/integrations/quickbooks/invoices";
import {
  findQuickBooksSalesReceiptByDocNumber,
  getQuickBooksSalesReceipt,
} from "@/lib/integrations/quickbooks/salesReceipts";
import type {
  LinkServiceInvoiceQuickBooksInput,
  ServiceInvoice,
  ServiceInvoiceQuickBooksRef,
} from "@/types/clientService";

export class QuickBooksLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuickBooksLinkError";
  }
}

const assertQuickBooksConfigured = (): void => {
  if (!isQuickBooksOAuthConfigured()) {
    throw new QuickBooksLinkError(
      "QuickBooks is not connected. Connect it under Admin → Integrations → QuickBooks."
    );
  }
};

const hasLinkInput = (input: LinkServiceInvoiceQuickBooksInput): boolean =>
  Boolean(
    input.invoiceId?.trim() ||
      input.invoiceNumber?.trim() ||
      input.salesReceiptId?.trim() ||
      input.salesReceiptNumber?.trim()
  );

const buildInvoiceRef = async (
  invoice: ServiceInvoice,
  qbInvoice: Awaited<ReturnType<typeof getQuickBooksInvoice>>
): Promise<ServiceInvoiceQuickBooksRef> => {
  const paymentLink = qbInvoice.Id
    ? await resolveQuickBooksInvoicePaymentLink(qbInvoice.Id)
    : null;

  return {
    customerId: qbInvoice.CustomerRef?.value,
    invoiceId: qbInvoice.Id,
    invoiceNumber: qbInvoice.DocNumber,
    salesReceiptId: undefined,
    salesReceiptNumber: undefined,
    paymentLink,
    syncedSubtotalCents: invoice.subtotalCents,
    syncedAmountCents: invoice.amountCents,
    syncStatus: "synced",
    lastSyncAt: new Date().toISOString(),
    lastError: undefined,
  };
};

const buildSalesReceiptRef = (
  invoice: ServiceInvoice,
  receipt: Awaited<ReturnType<typeof getQuickBooksSalesReceipt>>
): ServiceInvoiceQuickBooksRef => ({
  customerId: receipt.CustomerRef?.value,
  invoiceId: undefined,
  invoiceNumber: undefined,
  salesReceiptId: receipt.Id,
  salesReceiptNumber: receipt.DocNumber,
  paymentLink: null,
  syncedSubtotalCents: invoice.subtotalCents,
  syncedAmountCents: invoice.amountCents,
  syncStatus: "synced",
  lastSyncAt: new Date().toISOString(),
  lastError: undefined,
});

export const linkServiceInvoiceQuickBooksRef = async (input: {
  invoice: ServiceInvoice;
  link: LinkServiceInvoiceQuickBooksInput;
}): Promise<ServiceInvoiceQuickBooksRef | null> => {
  if (input.link.unlink) {
    return null;
  }

  if (!hasLinkInput(input.link)) {
    throw new QuickBooksLinkError(
      "Provide a QuickBooks invoice or sales receipt ID, or document number."
    );
  }

  assertQuickBooksConfigured();

  const invoiceId = input.link.invoiceId?.trim();
  if (invoiceId) {
    const qbInvoice = await getQuickBooksInvoice(invoiceId);
    if (!qbInvoice?.Id) {
      throw new QuickBooksLinkError(`QuickBooks invoice ${invoiceId} was not found.`);
    }
    return buildInvoiceRef(input.invoice, qbInvoice);
  }

  const invoiceNumber = input.link.invoiceNumber?.trim();
  if (invoiceNumber) {
    const qbInvoice = await findQuickBooksInvoiceByDocNumber(invoiceNumber);
    if (!qbInvoice?.Id) {
      throw new QuickBooksLinkError(
        `No QuickBooks invoice found with document number ${invoiceNumber}.`
      );
    }
    return buildInvoiceRef(input.invoice, qbInvoice);
  }

  const salesReceiptId = input.link.salesReceiptId?.trim();
  if (salesReceiptId) {
    const receipt = await getQuickBooksSalesReceipt(salesReceiptId);
    if (!receipt?.Id) {
      throw new QuickBooksLinkError(
        `QuickBooks sales receipt ${salesReceiptId} was not found.`
      );
    }
    return buildSalesReceiptRef(input.invoice, receipt);
  }

  const salesReceiptNumber = input.link.salesReceiptNumber?.trim();
  if (salesReceiptNumber) {
    const receipt = await findQuickBooksSalesReceiptByDocNumber(salesReceiptNumber);
    if (!receipt?.Id) {
      throw new QuickBooksLinkError(
        `No QuickBooks sales receipt found with document number ${salesReceiptNumber}.`
      );
    }
    return buildSalesReceiptRef(input.invoice, receipt);
  }

  throw new QuickBooksLinkError(
    "Provide a QuickBooks invoice or sales receipt ID, or document number."
  );
};
