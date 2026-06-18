import "server-only";

import { serverQuickBooksConfig } from "@/config/quickbooks";
import { saveInvoice } from "@/lib/client-services/storage";
import {
  createQuickBooksInvoice,
  createQuickBooksSalesReceipt,
  ensureQuickBooksCustomer,
  resolveQuickBooksInvoicePaymentLink,
} from "@/lib/integrations/quickbooks";
import { readQuickBooksTokens } from "@/lib/integrations/quickbooks/tokenStorage";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { ClientRecord } from "@/types/client";
import type {
  ClientService,
  ServiceInvoice,
  ServiceInvoiceQuickBooksRef,
} from "@/types/clientService";

const centsToDollars = (cents: number): number => cents / 100;

export const serviceInvoiceUsesQuickBooksPaymentSync = (
  invoice: ServiceInvoice
): boolean =>
  invoice.paymentMethod === "stripe" || invoice.paymentMethod === "quickbooks";

const buildServiceInvoiceQuickBooksLineItems = (input: {
  invoice: ServiceInvoice;
  service: ClientService;
}) => {
  const lineItems = [
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
    lineItems.push({
      amount: centsToDollars(input.invoice.processingFeeCents),
      description: feeLabel,
      quantity: 1,
      unitPrice: centsToDollars(input.invoice.processingFeeCents),
      itemId: serverQuickBooksConfig.defaultItemId || undefined,
    });
  }

  return lineItems;
};

const buildQuickBooksInvoiceRef = (
  customerId: string,
  invoiceId: string,
  invoiceNumber: string,
  paymentLink: string | null,
  existing?: ServiceInvoiceQuickBooksRef | null
): ServiceInvoiceQuickBooksRef => ({
  ...existing,
  customerId,
  invoiceId,
  invoiceNumber,
  paymentLink,
  syncStatus: "synced",
  lastSyncAt: new Date().toISOString(),
});

const forwardServiceInvoicePaymentToN8n = async (
  input: {
    invoice: ServiceInvoice;
    service: ClientService;
    client: ClientRecord;
  },
  payment: { provider: string; reference?: string }
): Promise<void> => {
  const webhookUrl = serverQuickBooksConfig.billingWebhookUrl;
  if (!webhookUrl) return;

  await forwardToN8n(
    webhookUrl,
    serverQuickBooksConfig.billingWebhookSecret,
    {
      type: "service_invoice.payment.succeeded",
      receivedAt: new Date().toISOString(),
      invoice: input.invoice,
      service: {
        serviceId: input.service.serviceId,
        title: input.service.title,
      },
      client: {
        clientId: input.client.clientId,
        email: input.client.email,
        name: input.client.name,
      },
      payment: {
        provider: payment.provider,
        reference: payment.reference,
        amountCents: input.invoice.amountCents,
      },
    }
  );
};

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

  const qbInvoice = await createQuickBooksInvoice({
    customerId: customer.Id,
    docNumber: input.invoice.invoiceNumber.slice(0, 21),
    dueDate: input.invoice.dueDate ?? undefined,
    privateNote: `TNP service invoice ${input.invoice.invoiceId}`,
    customerMemo: input.invoice.description || input.service.title,
    billEmail: customerEmail,
    allowOnlineCreditCardPayment: true,
    allowOnlineAchPayment: true,
    lineItems: buildServiceInvoiceQuickBooksLineItems(input),
  });

  const paymentLink = await resolveQuickBooksInvoicePaymentLink(qbInvoice.Id);

  return buildQuickBooksInvoiceRef(
    customer.Id,
    qbInvoice.Id,
    qbInvoice.DocNumber ?? input.invoice.invoiceNumber,
    paymentLink,
    existing
  );
};

const syncServiceInvoiceSalesReceiptDirect = async (input: {
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
  payment: { provider: string; reference?: string };
}): Promise<ServiceInvoiceQuickBooksRef> => {
  const existing = input.invoice.quickbooks;
  if (existing?.salesReceiptId && existing.syncStatus === "synced") {
    return existing;
  }

  const customerEmail = input.client.email.trim().toLowerCase();
  const displayName =
    input.client.name?.trim() ||
    input.client.email.split("@")[0] ||
    "Customer";

  const customer = await ensureQuickBooksCustomer({
    displayName,
    email: customerEmail,
  });

  const paymentNote = input.payment.reference
    ? ` · ${input.payment.provider} ${input.payment.reference}`
    : ` · ${input.payment.provider}`;

  const receipt = await createQuickBooksSalesReceipt({
    customerId: customer.Id,
    docNumber: input.invoice.invoiceNumber.slice(0, 21),
    privateNote: `Service invoice ${input.invoice.invoiceNumber}${paymentNote}`,
    customerMemo: input.invoice.description || input.service.title,
    lineItems: buildServiceInvoiceQuickBooksLineItems(input),
  });

  return {
    ...existing,
    customerId: customer.Id,
    salesReceiptId: receipt.Id,
    salesReceiptNumber: receipt.DocNumber,
    syncStatus: "synced",
    lastSyncAt: new Date().toISOString(),
    lastError: undefined,
  };
};

/** Record paid service invoice in QuickBooks (Sales Receipt for Stripe; QBO Invoice when pay-via-QB). */
export const syncServiceInvoicePaymentToQuickBooks = async (input: {
  clientId: string;
  serviceId: string;
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
  payment: { provider: string; reference?: string };
}): Promise<ServiceInvoice> => {
  if (!serviceInvoiceUsesQuickBooksPaymentSync(input.invoice)) {
    return input.invoice;
  }

  await forwardServiceInvoicePaymentToN8n(
    {
      invoice: input.invoice,
      service: input.service,
      client: input.client,
    },
    input.payment
  );

  const mode = serverQuickBooksConfig.syncMode;
  if (mode === "n8n") {
    return input.invoice;
  }

  const tokens = await readQuickBooksTokens();
  if (!tokens?.refreshToken) {
    console.info(
      "[service-invoices] QuickBooks not connected — skipping sales receipt"
    );
    return input.invoice;
  }

  try {
    let quickbooks: ServiceInvoiceQuickBooksRef;

    if (input.invoice.paymentMethod === "quickbooks") {
      if (input.invoice.quickbooks?.invoiceId) {
        quickbooks = {
          ...input.invoice.quickbooks,
          syncStatus: "synced",
          lastSyncAt: new Date().toISOString(),
          lastError: undefined,
        };
      } else {
        quickbooks = await syncServiceInvoiceSalesReceiptDirect(input);
      }
    } else {
      quickbooks = await syncServiceInvoiceSalesReceiptDirect(input);
    }

    return saveInvoice(input.clientId, input.serviceId, {
      ...input.invoice,
      quickbooks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "QuickBooks sync failed";
    const failed: ServiceInvoiceQuickBooksRef = {
      ...input.invoice.quickbooks,
      syncStatus: "failed",
      lastError: message,
      lastSyncAt: new Date().toISOString(),
    };
    console.error("[service-invoices] QuickBooks payment sync failed:", error);
    return saveInvoice(input.clientId, input.serviceId, {
      ...input.invoice,
      quickbooks: failed,
      updatedAt: new Date().toISOString(),
    });
  }
};
