/** Extensible payment method id (venmo, zelle, quickbooks, stripe, …). */
export type PaymentMethodId = string;

export type ClientServiceStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled";

export const CLIENT_SERVICE_STATUSES: ClientServiceStatus[] = [
  "draft",
  "active",
  "completed",
  "cancelled",
];

export type ServiceInvoiceStatus =
  | "draft"
  | "sent"
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "refunded";

/** QuickBooks income account routing via linked service items. */
export type QuickBooksIncomeCategory =
  | "deposit"
  | "birth_services"
  | "postpartum_support"
  | "other_operation_income";

export const QUICKBOOKS_INCOME_CATEGORIES: QuickBooksIncomeCategory[] = [
  "deposit",
  "birth_services",
  "postpartum_support",
  "other_operation_income",
];

export const QUICKBOOKS_INCOME_CATEGORY_LABELS: Record<
  QuickBooksIncomeCategory,
  string
> = {
  deposit: "Deposits",
  birth_services: "Birth Doula Services",
  postpartum_support: "Postpartum Doula Services",
  other_operation_income: "Other Operating Income (Classes, Massages, etc.)",
};

export const isQuickBooksIncomeCategory = (
  value: unknown
): value is QuickBooksIncomeCategory =>
  typeof value === "string" &&
  (QUICKBOOKS_INCOME_CATEGORIES as string[]).includes(value);

export const SERVICE_INVOICE_STATUSES: ServiceInvoiceStatus[] = [
  "draft",
  "sent",
  "pending_payment",
  "paid",
  "cancelled",
  "refunded",
];

export interface ServiceInvoiceQuickBooksRef {
  customerId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  /** QBO Sales Receipt after Stripe (or manual) payment — mirrors eGift cards. */
  salesReceiptId?: string;
  salesReceiptNumber?: string;
  /** QBO customer pay URL (InvoiceLink). */
  paymentLink?: string | null;
  /** Subtotal (before fee) last synced to QuickBooks. */
  syncedSubtotalCents?: number;
  /** Total (subtotal + fee) last synced to QuickBooks. */
  syncedAmountCents?: number;
  /** QBO service item Id used on the last sync. */
  syncedItemId?: string;
  syncStatus?: "pending" | "synced" | "failed";
  lastSyncAt?: string;
  lastError?: string;
}

export interface ServiceInvoiceStripeRef {
  checkoutSessionId?: string;
  paymentIntentId?: string;
  checkoutUrl?: string;
}

/** Formal bill for full payment or an installment on a client service. */
export interface ServiceInvoice {
  invoiceId: string;
  serviceId: string;
  clientId: string;
  /** Sequential formal number, e.g. TNP-2026-0042 */
  invoiceNumber: string;
  /** Service charge before processing fee. */
  subtotalCents: number;
  /** Card/Venmo processing fee added to subtotal when applicable. */
  processingFeeCents: number;
  /** Percent used when processingFeeCents > 0 (e.g. 3). */
  processingFeePercent: number | null;
  /** Total due (subtotal + processing fee). */
  amountCents: number;
  description: string;
  /** Explicit QBO income routing; null uses legacy inference at sync time. */
  quickbooksIncomeCategory: QuickBooksIncomeCategory | null;
  dueDate: string | null;
  paymentMethod: PaymentMethodId;
  status: ServiceInvoiceStatus;
  installmentIndex: number | null;
  installmentTotal: number | null;
  /** Optional annotation included in the client email and printable invoice. */
  notes: string;
  /** Snapshot of bill-to contact at send time. */
  customerName: string;
  customerEmail: string;
  /** Venmo/Zelle instructions or short label when a link is used. */
  paymentInstructions: string;
  /** Stripe checkout or Venmo deep link; null for Zelle-only instructions. */
  paymentLink: string | null;
  quickbooks: ServiceInvoiceQuickBooksRef | null;
  stripe: ServiceInvoiceStripeRef | null;
  /** Stored branded HTML document (invoice.html). */
  documentStorageKey: string | null;
  /** Client-facing Save as PDF page (valid ~1 year). */
  pdfDownloadUrl: string | null;
  pdfAccessExpiresAt: string | null;
  lastEmailError: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export interface InvoiceDispatchActor {
  sub: string;
  email: string;
}

/** Internal fee breakdown for a client service (Doula, TNP, transportation, …). */
export interface ClientServiceFeeItem {
  id: string;
  label: string;
  amountCents: number;
}

/** A service the client hired (billing anchor — proposal link is optional). */
export interface ClientService {
  serviceId: string;
  clientId: string;
  title: string;
  providerName: string;
  /** ISO date (YYYY-MM-DD) when the service starts or was booked. */
  serviceDate: string;
  /** Sum of `feeItems` when itemized; otherwise the entered total. */
  totalFeeCents: number;
  /** Optional internal line-item breakdown for proposals and tracking. */
  feeItems: ClientServiceFeeItem[];
  proposalId: string | null;
  googleDocUrl: string | null;
  status: ClientServiceStatus;
  notes: string;
  /** Linked service schedule engagement (when booked via schedule CRM). */
  engagementId: string | null;
  /** Provider registry id — `providerName` kept for display / legacy rows. */
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export interface ClientServiceWithInvoices extends ClientService {
  invoices: ServiceInvoice[];
  paidCents: number;
  balanceDueCents: number;
}

export interface CreateClientServiceInput {
  title: string;
  providerName?: string;
  serviceDate?: string;
  /** Required when `feeItems` is empty. Ignored when itemized fee items are provided. */
  totalFeeCents?: number;
  feeItems?: Array<{ id?: string; label: string; amountCents: number }>;
  proposalId?: string | null;
  googleDocUrl?: string | null;
  status?: ClientServiceStatus;
  notes?: string;
  engagementId?: string | null;
  providerId?: string | null;
}

export interface UpdateClientServiceInput {
  title?: string;
  providerName?: string;
  serviceDate?: string;
  totalFeeCents?: number;
  feeItems?: Array<{ id?: string; label: string; amountCents: number }>;
  proposalId?: string | null;
  googleDocUrl?: string | null;
  status?: ClientServiceStatus;
  notes?: string;
  engagementId?: string | null;
  providerId?: string | null;
}

export interface CreateServiceInvoiceInput {
  /** Base amount before processing fee. */
  amountCents: number;
  applyProcessingFee?: boolean;
  processingFeePercent?: number | null;
  description?: string;
  quickbooksIncomeCategory?: QuickBooksIncomeCategory | null;
  dueDate?: string | null;
  paymentMethod: PaymentMethodId;
  installmentIndex?: number | null;
  installmentTotal?: number | null;
  notes?: string;
  /** When true, mark as sent immediately after creation. */
  send?: boolean;
  /** Create invoice and mark paid without emailing the client. */
  markPaid?: boolean;
  /** Persist a printable invoice document without sending email. */
  generateDocument?: boolean;
}

/** Manually associate a TNP invoice with an existing QuickBooks record. */
export interface LinkServiceInvoiceQuickBooksInput {
  /** QBO internal Invoice Id (numeric string from QuickBooks). */
  invoiceId?: string;
  /** QBO Invoice DocNumber (customer-facing invoice #). */
  invoiceNumber?: string;
  /** QBO internal Sales Receipt Id. */
  salesReceiptId?: string;
  /** QBO Sales Receipt DocNumber. */
  salesReceiptNumber?: string;
  /** Clear any stored QuickBooks link on this invoice. */
  unlink?: boolean;
}

export interface UpdateServiceInvoiceInput {
  status?: ServiceInvoiceStatus;
  amountCents?: number;
  applyProcessingFee?: boolean;
  processingFeePercent?: number | null;
  description?: string;
  quickbooksIncomeCategory?: QuickBooksIncomeCategory | null;
  dueDate?: string | null;
  paymentMethod?: PaymentMethodId;
  notes?: string;
  markSent?: boolean;
  markPaid?: boolean;
  /** Resend email + refresh PDF for sent or paid invoices (e.g. insurance). */
  resend?: boolean;
  /** Update fields on a sent invoice and resend corrected copy to the client. */
  saveAndResend?: boolean;
  /** Update a paid invoice and refresh its printable document (no email). */
  saveCorrection?: boolean;
  /** Link or unlink a QuickBooks invoice / sales receipt. */
  linkQuickBooks?: LinkServiceInvoiceQuickBooksInput;
  /** Label a paid invoice as refunded (manual refunds — no payment API). */
  markRefunded?: boolean;
  /** Void linked QuickBooks invoice (when fully unpaid) and mark cancelled. */
  markCancelled?: boolean;
}
