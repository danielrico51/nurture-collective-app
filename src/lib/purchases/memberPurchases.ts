import { listPurchaseOrdersForMember } from "@/lib/billing/listOrders";
import { listGiftCardOrdersForMember } from "@/lib/giftCards/listOrders";
import { listMemberClientInvoices } from "@/lib/purchases/memberClientInvoices";
import { centsToDollars } from "@/lib/giftCards/validateOrder";
import type { GiftCardOrder } from "@/types/giftCard";
import type {
  MemberPurchase,
  MemberPaymentStatus,
  MemberPurchaseQuickBooks,
} from "@/types/memberPurchases";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/billing";

const mapGiftCardPaymentStatus = (status: GiftCardOrder["status"]): MemberPaymentStatus => {
  if (status === "paid" || status === "delivered") return "paid";
  if (status === "pending_payment") return "pending_payment";
  if (status === "cancelled") return "cancelled";
  return "other";
};

const mapBillingPaymentStatus = (status: PurchaseOrderStatus): MemberPaymentStatus => {
  if (status === "paid" || status === "invoice_paid") return "paid";
  if (status === "pending_payment" || status === "payment_processing") {
    return "pending_payment";
  }
  if (status === "invoice_pending" || status === "invoice_sent") {
    return status;
  }
  if (status === "cancelled") return "cancelled";
  if (status === "refunded") return "refunded";
  return "other";
};

const mapGiftCardQuickBooks = (
  qb?: GiftCardOrder["quickbooks"]
): MemberPurchaseQuickBooks => {
  if (!qb) return { syncStatus: "pending" };
  return {
    syncStatus: qb.syncStatus,
    lastSyncAt: qb.lastSyncAt,
    lastError: qb.lastError,
    documentType: "sales_receipt",
    documentId: qb.salesReceiptId,
    documentNumber: qb.salesReceiptNumber,
  };
};

const mapBillingQuickBooks = (
  qb?: PurchaseOrder["quickbooks"]
): MemberPurchaseQuickBooks => {
  if (!qb) return { syncStatus: "pending" };
  return {
    syncStatus: qb.syncStatus,
    lastSyncAt: qb.lastSyncAt,
    lastError: qb.lastError,
    documentType: qb.invoiceId ? "invoice" : undefined,
    documentId: qb.invoiceId ?? qb.paymentId,
    documentNumber: qb.invoiceNumber,
  };
};

const giftCardToMemberPurchase = (order: GiftCardOrder): MemberPurchase => {
  const amount = centsToDollars(order.amountCents);
  return {
    id: order.id,
    kind: "gift_card",
    title: `eGift card — ${formatUsd(amount)}`,
    description: order.message,
    amountCents: order.amountCents,
    currency: "USD",
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    paymentStatus: mapGiftCardPaymentStatus(order.status),
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    quickbooks: mapGiftCardQuickBooks(order.quickbooks),
    recipientLabel: `${order.recipient.name} (${order.recipient.email})`,
  };
};

const billingToMemberPurchase = (order: PurchaseOrder): MemberPurchase => {
  const lineSummary =
    order.lineItems.length > 0
      ? order.lineItems.map((line) => line.name).join(", ")
      : "Purchase";
  return {
    id: order.id,
    kind: "service",
    title: lineSummary,
    description: order.lineItems[0]?.description,
    amountCents: order.amountCents,
    currency: order.currency,
    createdAt: order.createdAt,
    paidAt:
      order.status === "paid" || order.status === "invoice_paid"
        ? order.updatedAt
        : undefined,
    paymentStatus: mapBillingPaymentStatus(order.status),
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    quickbooks: mapBillingQuickBooks(order.quickbooks),
  };
};

const formatUsd = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export const listMemberPurchases = async (input: {
  email: string;
  userId: string;
}): Promise<{ clientLinked: boolean; purchases: MemberPurchase[] }> => {
  const [giftCards, billing, clientInvoices] = await Promise.all([
    listGiftCardOrdersForMember({ email: input.email, userId: input.userId }),
    listPurchaseOrdersForMember(input),
    listMemberClientInvoices(input),
  ]);

  const purchases = [
    ...giftCards.map(giftCardToMemberPurchase),
    ...billing.map(billingToMemberPurchase),
    ...clientInvoices.purchases,
  ];

  return {
    clientLinked: clientInvoices.clientLinked,
    purchases: purchases.sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    ),
  };
};
