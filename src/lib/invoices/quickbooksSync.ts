import "server-only";

import { serverQuickBooksConfig } from "@/config/quickbooks";
import { saveInvoice } from "@/lib/client-services/storage";
import {
  buildServiceInvoiceQuickBooksLineItems,
  resolveQuickBooksInvoiceAmounts,
} from "@/lib/invoices/quickbooksInvoiceAmounts";
import {
  resolveServiceInvoiceIncomeCategory,
  resolveServiceInvoiceQuickBooksItemId,
} from "@/lib/invoices/quickbooksIncomeRouting";
import { readEngagementServiceType } from "@/lib/schedule/storage";
import {
  createQuickBooksInvoice,
  createQuickBooksInvoicePayment,
  createQuickBooksSalesReceipt,
  ensureQuickBooksCustomer,
  findQuickBooksInvoiceByDocNumber,
  getQuickBooksInvoice,
  quickBooksInvoiceUsesServiceItemId,
  resolveQuickBooksInvoicePaymentLink,
  voidQuickBooksInvoice,
} from "@/lib/integrations/quickbooks";
import { QuickBooksApiClientError } from "@/lib/integrations/quickbooks/client";
import { readQuickBooksTokens } from "@/lib/integrations/quickbooks/tokenStorage";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { ClientRecord } from "@/types/client";
import type {
  ClientService,
  ServiceInvoice,
  ServiceInvoiceQuickBooksRef,
} from "@/types/clientService";

export const serviceInvoiceQuickBooksSyncEnabled = (): boolean => {
  const mode = serverQuickBooksConfig.syncMode;
  return mode === "direct" || mode === "hybrid";
};

/** Stripe checkout records a sales receipt on payment — skip open QBO invoice on send. */
export const shouldCreateQuickBooksInvoiceOnSend = (
  invoice: ServiceInvoice
): boolean => invoice.paymentMethod !== "stripe";

export const serviceInvoiceUsesQuickBooksPaymentSync = (
  _invoice: ServiceInvoice
): boolean => serviceInvoiceQuickBooksSyncEnabled();

const buildQuickBooksInvoiceRef = (
  customerId: string,
  invoiceId: string,
  invoiceNumber: string,
  paymentLink: string | null,
  amounts: ReturnType<typeof resolveQuickBooksInvoiceAmounts>,
  itemId: string,
  existing?: ServiceInvoiceQuickBooksRef | null
): ServiceInvoiceQuickBooksRef => ({
  ...existing,
  customerId,
  invoiceId,
  invoiceNumber,
  paymentLink,
  syncedSubtotalCents: amounts.subtotalCents,
  syncedAmountCents: amounts.amountCents,
  syncedItemId: itemId || existing?.syncedItemId,
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

const isQuickBooksDuplicateDocNumberError = (error: unknown): boolean => {
  if (!(error instanceof QuickBooksApiClientError)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("duplicate document number") ||
    message.includes("docnumber") ||
    message.includes("document number already exists")
  );
};

const createOrReuseQuickBooksInvoice = async (input: {
  customerId: string;
  docNumber: string;
  dueDate?: string;
  privateNote: string;
  customerMemo: string;
  billEmail: string;
  allowOnline: boolean;
  lineItems: ReturnType<typeof buildServiceInvoiceQuickBooksLineItems>;
}): Promise<Awaited<ReturnType<typeof createQuickBooksInvoice>>> => {
  try {
    return await createQuickBooksInvoice({
      customerId: input.customerId,
      docNumber: input.docNumber,
      dueDate: input.dueDate,
      privateNote: input.privateNote,
      customerMemo: input.customerMemo,
      billEmail: input.billEmail,
      allowOnlineCreditCardPayment: input.allowOnline,
      allowOnlineAchPayment: input.allowOnline,
      lineItems: input.lineItems,
    });
  } catch (error) {
    if (!isQuickBooksDuplicateDocNumberError(error)) {
      throw error;
    }

    const existing = await findQuickBooksInvoiceByDocNumber(input.docNumber);
    if (!existing?.Id) {
      throw error;
    }

    return existing;
  }
};

const refreshExistingQuickBooksInvoice = async (
  existing: ServiceInvoiceQuickBooksRef,
  amounts: ReturnType<typeof resolveQuickBooksInvoiceAmounts>,
  itemId: string
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
    syncedItemId: itemId || existing.syncedItemId,
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
  amounts: ReturnType<typeof resolveQuickBooksInvoiceAmounts>,
  itemId: string
): Promise<boolean> => {
  if (!existing.invoiceId || existing.syncStatus !== "synced") {
    return false;
  }

  if (itemId && existing.syncedItemId && existing.syncedItemId !== itemId) {
    return false;
  }

  if (itemId && existing.invoiceId) {
    try {
      const qbInvoice = await getQuickBooksInvoice(existing.invoiceId);
      if (!quickBooksInvoiceUsesServiceItemId(qbInvoice, itemId)) {
        return false;
      }
    } catch {
      return false;
    }
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
  allowOnlinePayments?: boolean;
  paymentMethodLabel?: string;
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
  const incomeCategory = resolveServiceInvoiceIncomeCategory({
    invoice: input.invoice,
    service: input.service,
    engagementServiceType,
  });

  if (!quickBooksItemId) {
    const configHint =
      incomeCategory === "deposit"
        ? "Set QBO_DEFERRED_REVENUE_ITEM_ID or QBO_DEPOSIT_ITEM_ID"
        : "Set the category QuickBooks item env var or QBO_DEFAULT_ITEM_ID";
    throw new Error(
      `QuickBooks service item is not configured for ${incomeCategory}. ${configHint}.`
    );
  }

  const lineItems = buildServiceInvoiceQuickBooksLineItems({
    invoice: input.invoice,
    serviceTitle: input.service.title,
    itemId: quickBooksItemId,
  });

  if (existing?.invoiceId && (await shouldReuseQuickBooksInvoice(existing, amounts, quickBooksItemId))) {
    return refreshExistingQuickBooksInvoice(existing, amounts, quickBooksItemId);
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
  const docNumber = existing?.invoiceId
    ? `${baseDocNumber.slice(0, 18)}-R`.slice(0, 21)
    : baseDocNumber;

  const allowOnline = input.allowOnlinePayments ?? false;
  const paymentLabel = input.paymentMethodLabel?.trim();
  const privateNote = [
    `TNP service invoice ${input.invoice.invoiceId}`,
    paymentLabel ? `Payment method: ${paymentLabel}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const qbInvoice = await createOrReuseQuickBooksInvoice({
    customerId: customer.Id,
    docNumber,
    dueDate: input.invoice.dueDate ?? undefined,
    privateNote,
    customerMemo: input.invoice.description || input.service.title,
    billEmail: customerEmail,
    allowOnline,
    lineItems,
  });

  const paymentLink = allowOnline
    ? await resolveQuickBooksInvoicePaymentLink(qbInvoice.Id)
    : null;

  return buildQuickBooksInvoiceRef(
    customer.Id,
    qbInvoice.Id,
    qbInvoice.DocNumber ?? docNumber,
    paymentLink,
    amounts,
    quickBooksItemId,
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
    syncedItemId: quickBooksItemId || existing?.syncedItemId,
    syncStatus: "synced",
    lastSyncAt: new Date().toISOString(),
    lastError: undefined,
  };
};

const recordQuickBooksInvoicePayment = async (input: {
  invoice: ServiceInvoice;
  service: ClientService;
  payment: { provider: string; reference?: string };
}): Promise<ServiceInvoiceQuickBooksRef> => {
  const existing = input.invoice.quickbooks;
  const qbInvoiceId = existing?.invoiceId;
  const customerId = existing?.customerId;
  if (!qbInvoiceId || !customerId) {
    throw new Error("QuickBooks invoice link is required to record payment");
  }

  const amounts = resolveQuickBooksInvoiceAmounts(input.invoice);
  const paymentNote = input.payment.reference
    ? `${input.payment.provider} ${input.payment.reference}`
    : input.payment.provider;

  await createQuickBooksInvoicePayment({
    customerId,
    invoiceId: qbInvoiceId,
    amount: amounts.amountCents / 100,
    privateNote: `TNP ${input.invoice.invoiceNumber} · ${paymentNote}`,
  });

  return {
    ...existing,
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
    } else if (
      input.invoice.paymentMethod === "stripe" ||
      !input.invoice.quickbooks?.invoiceId
    ) {
      quickbooks = await syncServiceInvoiceSalesReceiptDirect(input);
    } else {
      quickbooks = await recordQuickBooksInvoicePayment(input);
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
