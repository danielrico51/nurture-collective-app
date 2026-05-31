import { serverQuickBooksConfig } from "@/config/quickbooks";
import { serverBillingConfig } from "@/config/billing";
import { emitBillingEvent } from "@/lib/billing/n8nEvents";
import { writePurchaseOrder } from "@/lib/billing/storage";
import {
  createQuickBooksInvoice,
  ensureQuickBooksCustomer,
  sendQuickBooksInvoice,
} from "@/lib/integrations/quickbooks";
import { getBillingPaymentProvider } from "@/lib/payments/getProvider";
import type { PurchaseOrder } from "@/types/billing";

const centsToDollars = (cents: number): number => cents / 100;

export const syncPurchaseOrderToQuickBooks = async (
  order: PurchaseOrder,
  options?: { sendInvoice?: boolean }
): Promise<PurchaseOrder> => {
  const displayName =
    order.customerName?.trim() || order.customerEmail.split("@")[0] || "Customer";

  const customer = await ensureQuickBooksCustomer({
    displayName,
    email: order.customerEmail,
  });

  const invoice = await createQuickBooksInvoice({
    customerId: customer.Id,
    docNumber: order.id.slice(0, 21),
    privateNote: `Nurture Collective order ${order.id}`,
    customerMemo: "Thank you for your purchase.",
    lineItems: order.lineItems.map((item) => ({
      amount: centsToDollars(item.unitAmountCents * item.quantity),
      description: item.description ?? item.name,
      quantity: item.quantity,
      unitPrice: centsToDollars(item.unitAmountCents),
    })),
  });

  if (options?.sendInvoice) {
    await sendQuickBooksInvoice(invoice.Id, order.customerEmail);
  }

  const updated: PurchaseOrder = {
    ...order,
    status: options?.sendInvoice ? "invoice_sent" : "invoice_pending",
    quickbooks: {
      customerId: customer.Id,
      invoiceId: invoice.Id,
      invoiceNumber: invoice.DocNumber,
      syncStatus: "synced",
      lastSyncAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  await writePurchaseOrder(updated);
  return updated;
};

export const maybeSyncOrderToQuickBooks = async (
  order: PurchaseOrder,
  trigger: "order_created" | "payment_succeeded" | "invoice_requested"
): Promise<PurchaseOrder> => {
  const mode = serverQuickBooksConfig.syncMode;

  if (mode === "n8n") {
    const eventType =
      trigger === "payment_succeeded"
        ? "billing.payment.succeeded"
        : trigger === "invoice_requested"
          ? "billing.invoice.requested"
          : "billing.order.created";

    await emitBillingEvent({ type: eventType, order });
    return order;
  }

  if (mode === "direct" || mode === "hybrid") {
    try {
      const synced = await syncPurchaseOrderToQuickBooks(order, {
        sendInvoice: trigger === "invoice_requested" || order.status === "paid",
      });
      await emitBillingEvent({
        type: "billing.invoice.synced",
        order: synced,
        quickbooks: {
          customerId: synced.quickbooks?.customerId,
          invoiceId: synced.quickbooks?.invoiceId,
          invoiceNumber: synced.quickbooks?.invoiceNumber,
        },
      });
      return synced;
    } catch (error) {
      const message = error instanceof Error ? error.message : "QuickBooks sync failed";
      const failed: PurchaseOrder = {
        ...order,
        quickbooks: {
          ...order.quickbooks,
          syncStatus: "failed",
          lastError: message,
          lastSyncAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      await writePurchaseOrder(failed);
      throw error;
    }
  }

  return order;
};

export const createPaymentCheckoutForOrder = async (order: PurchaseOrder, urls: {
  successUrl: string;
  cancelUrl: string;
}) => {
  const provider = getBillingPaymentProvider();
  const description = order.lineItems
    .map((item) => item.name)
    .slice(0, 3)
    .join(", ");

  return provider.createCheckout({
    orderId: order.id,
    amountCents: order.amountCents,
    currency: "USD",
    description: description || "Nurture Collective purchase",
    purchaserEmail: order.customerEmail,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
    metadata: {
      orderId: order.id,
      billing: "true",
      ...(order.userId ? { userId: order.userId } : {}),
      ...(order.clientId ? { clientId: order.clientId } : {}),
    },
  });
};

export const resolveBillingPaymentProvider = (): string =>
  serverBillingConfig.paymentProvider;
