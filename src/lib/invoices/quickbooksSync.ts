import "server-only";

import { serverQuickBooksConfig } from "@/config/quickbooks";
import {
  createQuickBooksInvoice,
  ensureQuickBooksCustomer,
  resolveQuickBooksInvoicePaymentLink,
} from "@/lib/integrations/quickbooks";
import type { ClientRecord } from "@/types/client";
import type {
  ClientService,
  ServiceInvoice,
  ServiceInvoiceQuickBooksRef,
} from "@/types/clientService";

const centsToDollars = (cents: number): number => cents / 100;

const buildQuickBooksRef = (
  customerId: string,
  invoiceId: string,
  invoiceNumber: string,
  paymentLink: string | null
): ServiceInvoiceQuickBooksRef => ({
  customerId,
  invoiceId,
  invoiceNumber,
  paymentLink,
  syncStatus: "synced",
  lastSyncAt: new Date().toISOString(),
});

export const syncServiceInvoiceToQuickBooks = async (input: {
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
}): Promise<ServiceInvoiceQuickBooksRef> => {
  const customerEmail = input.client.email.trim().toLowerCase();
  const existing = input.invoice.quickbooks;

  if (existing?.invoiceId && existing.syncStatus === "synced") {
    const paymentLink =
      existing.paymentLink ??
      (await resolveQuickBooksInvoicePaymentLink(existing.invoiceId));
    return {
      ...existing,
      paymentLink,
      lastSyncAt: new Date().toISOString(),
    };
  }

  const displayName =
    input.client.name?.trim() ||
    input.client.email.split("@")[0] ||
    "Customer";

  const customer = await ensureQuickBooksCustomer({
    displayName,
    email: customerEmail,
  });

  const qbLineItems = [
    {
      amount: centsToDollars(input.invoice.subtotalCents),
      description: input.invoice.description || input.service.title,
      quantity: 1,
      unitPrice: centsToDollars(input.invoice.subtotalCents),
      itemId: serverQuickBooksConfig.defaultItemId || undefined,
    },
  ];

  if ((input.invoice.processingFeeCents ?? 0) > 0) {
    const feeLabel =
      input.invoice.processingFeePercent != null
        ? `Processing fee (${input.invoice.processingFeePercent}%)`
        : "Processing fee";
    qbLineItems.push({
      amount: centsToDollars(input.invoice.processingFeeCents),
      description: feeLabel,
      quantity: 1,
      unitPrice: centsToDollars(input.invoice.processingFeeCents),
      itemId: serverQuickBooksConfig.defaultItemId || undefined,
    });
  }

  const qbInvoice = await createQuickBooksInvoice({
    customerId: customer.Id,
    docNumber: input.invoice.invoiceNumber.slice(0, 21),
    dueDate: input.invoice.dueDate ?? undefined,
    privateNote: `TNP service invoice ${input.invoice.invoiceId}`,
    customerMemo: input.invoice.description || input.service.title,
    billEmail: customerEmail,
    allowOnlineCreditCardPayment: true,
    allowOnlineAchPayment: true,
    lineItems: qbLineItems,
  });

  const paymentLink = await resolveQuickBooksInvoicePaymentLink(qbInvoice.Id);

  return buildQuickBooksRef(
    customer.Id,
    qbInvoice.Id,
    qbInvoice.DocNumber ?? input.invoice.invoiceNumber,
    paymentLink
  );
};
