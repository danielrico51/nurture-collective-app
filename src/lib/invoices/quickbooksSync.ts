import "server-only";

import { serverQuickBooksConfig } from "@/config/quickbooks";
import { saveInvoice } from "@/lib/client-services/storage";
import {
  buildServiceInvoiceQuickBooksLineItems,
  resolveQuickBooksInvoiceAmounts,
} from "@/lib/invoices/quickbooksInvoiceAmounts";
import { resolveServiceInvoiceQuickBooksItemId } from "@/lib/invoices/quickbooksIncomeRouting";
import { readEngagementServiceType } from "@/lib/schedule/storage";
import {
  createQuickBooksInvoice,
  createQuickBooksSalesReceipt,
  ensureQuickBooksCustomer,
  getQuickBooksInvoice,
  resolveQuickBooksInvoicePaymentLink,
  voidQuickBooksInvoice,
} from "@/lib/integrations/quickbooks";
import { readQuickBooksTokens } from "@/lib/integrations/quickbooks/tokenStorage";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { ClientRecord } from "@/types/client";
import type {
  ClientService,
  ServiceInvoice,
  ServiceInvoiceQuickBooksRef,
} from "@/types/clientService";

export const serviceInvoiceUsesQuickBooksPaymentSync = (
  invoice: ServiceInvoice
): boolean =>
  invoice.paymentMethod === "stripe" || invoice.paymentMethod === "quickbooks";

const buildQuickBooksInvoiceRef = (
  customerId: string,
  invoiceId: string,
  invoiceNumber: string,
  paymentLink: string | null,
  amounts: ReturnType<typeof resolveQuickBooksInvoiceAmounts>,
  existing?: ServiceInvoiceQuickBooksRef | null
): ServiceInvoiceQuickBooksRef => ({
  ...existing,
  customerId,
  invoiceId,
  invoiceNumber,
  paymentLink,
  syncedSubtotalCents: amounts.subtotalCents,
  syncedAmountCents: amounts.amountCents,
  syncStatus: "synced",
  lastSyncAt: new Date().toISOString(),
  lastError: undefined,
});

const quickBooksTotalCents = (totalAmt: number | undefined): number =>
  Math.round((totalAmt ?? 0) * 100);

const invoiceFullyUnpaid = (balance: number | undefined, totalAmt: number | undefined): boolean => {
  if (balance == null || totalAmt == null) return false;
  return balance >= totalAmt && totalAmt > 0;
};

const refreshExistingQuickBooksInvoice = async (
  existing: ServiceInvoiceQuickBooksRef,
  amounts: ReturnType<typeof resolveQuickBooksInvoiceAmounts>
): Promise<ServiceInvoiceQuickBooksRef> => {
  const paymentLink =
    existing.paymentLink ??
    (existing.invoiceId
      ? await resolveQuickBooksInvoicePaymentLink(existing.invoiceId)
      : null);

  return {
    ...existing,
    paymentLink,
    syncedSubtotalCents: amounts.subtotalCents,
    syncedAmountCents: amounts.amountCents,
    syncStatus: "synced",
    lastSyncAt: new Date().toISOString(),
    lastError: undefined,
  };
};

const voidStaleQuickBooksInvoice = async (
  invoiceId: string
): Promise<void> => {
  try {
    const qbInvoice = await getQuickBooksInvoice(invoiceId);
    if (invoiceFullyUnpaid(qbInvoice.Balance, qbInvoice.TotalAmt)) {
      await voidQuickBooksInvoice(qbInvoice);
    }
  } catch (error) {
    console.warn(
      "[service-invoices] Could not void stale QuickBooks invoice:",
      error
    );
  }
};

const shouldReuseQuickBooksInvoice = async (
  existing: ServiceInvoiceQuickBooksRef,
  amounts: ReturnType<typeof resolveQuickBooksInvoiceAmounts>
): Promise<boolean> => {
  if (!existing.invoiceId || existing.syncStatus !== "synced") {
    return false;
  }

  if (
    existing.syncedAmountCents === amounts.amountCents &&
    existing.syncedSubtotalCents === amounts.subtotalCents
  ) {
    return true;
  }

  try {
    const qbInvoice = await getQuickBooksInvoice(existing.invoiceId);
    const qbTotalCents = quickBooksTotalCents(qbInvoice.TotalAmt);
    return (
      qbTotalCents === amounts.amountCents &&
      (qbInvoice.Balance ?? 0) > 0
    );
  } catch {
    return false;
  }
};

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

  const amounts = resolveQuickBooksInvoiceAmounts(input.invoice);

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
        amountCents: amounts.amountCents,
        subtotalCents: amounts.subtotalCents,
        processingFeeCents: amounts.processingFeeCents,
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
  const amounts = resolveQuickBooksInvoiceAmounts(input.invoice);
  const engagementServiceType = await readEngagementServiceType(
    input.service.clientId,
    input.service.engagementId
  );
  const quickBooksItemId = resolveServiceInvoiceQuickBooksItemId({
    invoice: input.invoice,
    service: input.service,
    engagementServiceType,
  });
  const lineItems = buildServiceInvoiceQuickBooksLineItems({
    invoice: input.invoice,
    serviceTitle: input.service.title,
    itemId: quickBooksItemId || undefined,
  });

  if (existing?.invoiceId && (await shouldReuseQuickBooksInvoice(existing, amounts))) {
    return refreshExistingQuickBooksInvoice(existing, amounts);
  }

  if (existing?.invoiceId) {
    await voidStaleQuickBooksInvoice(existing.invoiceId);
  }

  const displayName =
    input.client.name?.trim() ||
    input.client.email.split("@")[0] ||
    "Customer";

  const customer = await ensureQuickBooksCustomer({
    displayName,
    email: customerEmail,
  });

  const baseDocNumber = input.invoice.invoiceNumber.slice(0, 21);
  const docNumber =
    existing?.invoiceId && existing.syncedAmountCents !== amounts.amountCents
      ? `${baseDocNumber.slice(0, 18)}-R`.slice(0, 21)
      : baseDocNumber;

  const qbInvoice = await createQuickBooksInvoice({
    customerId: customer.Id,
    docNumber,
    dueDate: input.invoice.dueDate ?? undefined,
    privateNote: `TNP service invoice ${input.invoice.invoiceId}`,
    customerMemo: input.invoice.description || input.service.title,
    billEmail: customerEmail,
    allowOnlineCreditCardPayment: true,
    allowOnlineAchPayment: true,
    lineItems,
  });

  const paymentLink = await resolveQuickBooksInvoicePaymentLink(qbInvoice.Id);

  return buildQuickBooksInvoiceRef(
    customer.Id,
    qbInvoice.Id,
    qbInvoice.DocNumber ?? docNumber,
    paymentLink,
    amounts,
    existing?.invoiceId ? { ...existing, invoiceId: undefined } : existing
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

  const amounts = resolveQuickBooksInvoiceAmounts(input.invoice);
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

  const engagementServiceType = await readEngagementServiceType(
    input.service.clientId,
    input.service.engagementId
  );
  const quickBooksItemId = resolveServiceInvoiceQuickBooksItemId({
    invoice: input.invoice,
    service: input.service,
    engagementServiceType,
  });

  const receipt = await createQuickBooksSalesReceipt({
    customerId: customer.Id,
    docNumber: input.invoice.invoiceNumber.slice(0, 21),
    privateNote: `Service invoice ${input.invoice.invoiceNumber}${paymentNote}`,
    customerMemo: input.invoice.description || input.service.title,
    lineItems: buildServiceInvoiceQuickBooksLineItems({
      invoice: input.invoice,
      serviceTitle: input.service.title,
      itemId: quickBooksItemId || undefined,
    }),
  });

  return {
    ...existing,
    customerId: customer.Id,
    salesReceiptId: receipt.Id,
    salesReceiptNumber: receipt.DocNumber,
    syncedSubtotalCents: amounts.subtotalCents,
    syncedAmountCents: amounts.amountCents,
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
