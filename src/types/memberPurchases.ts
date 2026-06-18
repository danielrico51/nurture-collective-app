import type { QuickBooksSyncStatus } from "@/types/giftCard";

export type MemberPurchaseKind = "gift_card" | "service" | "client_invoice";

export type MemberPaymentStatus =
  | "pending_payment"
  | "paid"
  | "invoice_pending"
  | "invoice_sent"
  | "cancelled"
  | "refunded"
  | "other";

export interface MemberPurchaseQuickBooks {
  syncStatus: QuickBooksSyncStatus | "not_applicable";
  lastSyncAt?: string;
  lastError?: string;
  documentType?: "sales_receipt" | "invoice";
  documentId?: string;
  documentNumber?: string;
}

export interface MemberPurchase {
  id: string;
  kind: MemberPurchaseKind;
  title: string;
  description?: string;
  amountCents: number;
  currency: "USD";
  createdAt: string;
  paidAt?: string;
  paymentStatus: MemberPaymentStatus;
  paymentProvider?: string;
  paymentReference?: string;
  quickbooks: MemberPurchaseQuickBooks;
  recipientLabel?: string;
  /** CRM service invoice fields (kind client_invoice). */
  invoiceNumber?: string;
  printUrl?: string;
  dueDate?: string | null;
  serviceTitle?: string;
  installmentLabel?: string;
  subtotalCents?: number;
  processingFeeCents?: number;
}

export interface MemberPurchasesResponse {
  ok: true;
  email: string;
  /** True when this account is linked to a Client CRM record. */
  clientLinked: boolean;
  purchases: MemberPurchase[];
}
