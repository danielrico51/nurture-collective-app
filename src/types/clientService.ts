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
  syncStatus?: "pending" | "synced" | "failed";
  lastSyncAt?: string;
  lastError?: string;
}

export interface ServiceInvoiceStripeRef {
  checkoutSessionId?: string;
  paymentIntentId?: string;
}

/** Formal bill for full payment or an installment on a client service. */
export interface ServiceInvoice {
  invoiceId: string;
  serviceId: string;
  clientId: string;
  /** Sequential formal number, e.g. TNP-2026-0042 */
  invoiceNumber: string;
  amountCents: number;
  description: string;
  dueDate: string | null;
  paymentMethod: PaymentMethodId;
  status: ServiceInvoiceStatus;
  installmentIndex: number | null;
  installmentTotal: number | null;
  quickbooks: ServiceInvoiceQuickBooksRef | null;
  stripe: ServiceInvoiceStripeRef | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

/** A service the client hired (billing anchor — proposal link is optional). */
export interface ClientService {
  serviceId: string;
  clientId: string;
  title: string;
  providerName: string;
  /** ISO date (YYYY-MM-DD) when the service starts or was booked. */
  serviceDate: string;
  totalFeeCents: number;
  proposalId: string | null;
  googleDocUrl: string | null;
  status: ClientServiceStatus;
  notes: string;
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
  totalFeeCents: number;
  proposalId?: string | null;
  googleDocUrl?: string | null;
  status?: ClientServiceStatus;
  notes?: string;
}

export interface UpdateClientServiceInput {
  title?: string;
  providerName?: string;
  serviceDate?: string;
  totalFeeCents?: number;
  proposalId?: string | null;
  googleDocUrl?: string | null;
  status?: ClientServiceStatus;
  notes?: string;
}

export interface CreateServiceInvoiceInput {
  amountCents: number;
  description?: string;
  dueDate?: string | null;
  paymentMethod: PaymentMethodId;
  installmentIndex?: number | null;
  installmentTotal?: number | null;
  /** When true, mark as sent immediately after creation. */
  send?: boolean;
}

export interface UpdateServiceInvoiceInput {
  status?: ServiceInvoiceStatus;
  amountCents?: number;
  description?: string;
  dueDate?: string | null;
  paymentMethod?: PaymentMethodId;
  markSent?: boolean;
  markPaid?: boolean;
}
