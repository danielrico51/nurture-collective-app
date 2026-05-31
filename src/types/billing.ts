export type PurchaseOrderStatus =
  | "pending_payment"
  | "payment_processing"
  | "paid"
  | "invoice_pending"
  | "invoice_sent"
  | "invoice_paid"
  | "cancelled"
  | "refunded";

export type QuickBooksSyncStatus = "pending" | "synced" | "failed";

export interface PurchaseLineItem {
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unitAmountCents: number;
}

export interface PurchaseOrderQuickBooksRef {
  customerId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  paymentId?: string;
  syncStatus: QuickBooksSyncStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface PurchaseOrder {
  id: string;
  status: PurchaseOrderStatus;
  userId?: string;
  clientId?: string;
  leadId?: string;
  customerEmail: string;
  customerName?: string;
  lineItems: PurchaseLineItem[];
  amountCents: number;
  currency: "USD";
  paymentProvider?: string;
  paymentReference?: string;
  quickbooks?: PurchaseOrderQuickBooksRef;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseCheckoutRequest {
  customerEmail: string;
  customerName?: string;
  userId?: string;
  clientId?: string;
  leadId?: string;
  lineItems: PurchaseLineItem[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  /** When true, skip payment and request invoice creation only (B2B / post-contract). */
  invoiceOnly?: boolean;
}

export interface PurchaseCheckoutResponse {
  ok: true;
  orderId: string;
  status: PurchaseOrderStatus;
  provider: string;
  checkoutUrl?: string;
  clientSecret?: string;
  message?: string;
}
