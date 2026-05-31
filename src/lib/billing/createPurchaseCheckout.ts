import { randomUUID } from "crypto";
import { emitBillingEvent } from "@/lib/billing/n8nEvents";
import {
  createPaymentCheckoutForOrder,
  maybeSyncOrderToQuickBooks,
} from "@/lib/billing/quickbooksSync";
import { writePurchaseOrder } from "@/lib/billing/storage";
import type { GiftCardPaymentResult } from "@/lib/payments/types";
import type {
  PurchaseCheckoutRequest,
  PurchaseOrder,
  PurchaseOrderStatus,
} from "@/types/billing";

const sumLineItemsCents = (
  lineItems: PurchaseCheckoutRequest["lineItems"]
): number =>
  lineItems.reduce(
    (total, item) => total + item.unitAmountCents * item.quantity,
    0
  );

export const createPurchaseCheckout = async (input: PurchaseCheckoutRequest) => {
  const orderId = randomUUID();
  const createdAt = new Date().toISOString();
  const amountCents = sumLineItemsCents(input.lineItems);

  if (amountCents <= 0) {
    throw new Error("Order total must be greater than zero");
  }

  const initialStatus: PurchaseOrderStatus = input.invoiceOnly
    ? "invoice_pending"
    : "pending_payment";

  const order: PurchaseOrder = {
    id: orderId,
    status: initialStatus,
    userId: input.userId,
    clientId: input.clientId,
    leadId: input.leadId,
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerName: input.customerName?.trim(),
    lineItems: input.lineItems,
    amountCents,
    currency: "USD",
    metadata: input.metadata,
    quickbooks: { syncStatus: "pending" },
    createdAt,
    updatedAt: createdAt,
  };

  await writePurchaseOrder(order);

  console.info("[billing] Order created", {
    orderId,
    amountCents,
    customerEmail: order.customerEmail,
    invoiceOnly: Boolean(input.invoiceOnly),
  });

  if (input.invoiceOnly) {
    const syncedOrder = await maybeSyncOrderToQuickBooks(order, "invoice_requested");
    const payment: GiftCardPaymentResult = {
      provider: "stub",
      orderId,
      status: "pending_payment",
      message: "Invoice requested — payment link will be sent separately.",
    };
    return {
      order: syncedOrder,
      payment,
    };
  }

  await emitBillingEvent({ type: "billing.order.created", order });

  const payment = await createPaymentCheckoutForOrder(order, {
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
  });

  const updatedOrder: PurchaseOrder = {
    ...order,
    paymentProvider: payment.provider,
    paymentReference: payment.paymentReference,
    updatedAt: new Date().toISOString(),
  };
  await writePurchaseOrder(updatedOrder);

  return {
    order: updatedOrder,
    payment,
  };
};

export const markPurchaseOrderPaid = async (
  orderId: string,
  payment: { provider: string; reference?: string }
): Promise<PurchaseOrder> => {
  const { readPurchaseOrder, updatePurchaseOrder } = await import(
    "@/lib/billing/storage"
  );
  const existing = await readPurchaseOrder(orderId);
  if (!existing) {
    throw new Error(`Purchase order not found: ${orderId}`);
  }

  const paid = await updatePurchaseOrder(orderId, {
    status: "paid",
    paymentProvider: payment.provider,
    paymentReference: payment.reference,
  });

  await emitBillingEvent({
    type: "billing.payment.succeeded",
    order: paid,
    payment: {
      provider: payment.provider,
      reference: payment.reference,
      amountCents: paid.amountCents,
    },
  });

  return maybeSyncOrderToQuickBooks(paid, "payment_succeeded");
};
