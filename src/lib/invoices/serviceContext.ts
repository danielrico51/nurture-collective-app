import {
  computeServiceBalanceDueCents,
  sumPaidInvoiceCents,
  sumPaidInvoiceTotalCents,
} from "@/lib/client-services/balances";
import type { ClientService, ServiceInvoice } from "@/types/clientService";

export interface InvoicePaymentHistoryEntry {
  invoiceId: string;
  invoiceNumber: string;
  description: string;
  amountCents: number;
  statusLabel: string;
  paidAt: string | null;
  isCurrent: boolean;
}

export interface InvoiceServiceContext {
  totalFeeCents: number;
  /** Service amount paid (excludes processing fees). */
  paidCents: number;
  /** Total cash received on paid invoices (includes processing fees). */
  paidTotalCents: number;
  balanceDueCents: number;
  paymentTypeLabel: string;
  paymentStatusLabel: string;
  paymentHistory: InvoicePaymentHistoryEntry[];
}

export const formatClientInvoiceStatusLabel = (
  status: ServiceInvoice["status"]
): string => {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending_payment":
    case "sent":
      return "Unpaid";
    case "draft":
      return "Draft";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
};

export const resolveInvoicePaymentTypeLabel = (
  invoice: ServiceInvoice,
  service: ClientService,
  balanceDueCents: number
): string => {
  if (invoice.installmentIndex != null) {
    const ofTotal = invoice.installmentTotal
      ? ` of ${invoice.installmentTotal}`
      : "";
    return `Installment ${invoice.installmentIndex}${ofTotal}`;
  }

  if (invoice.amountCents >= service.totalFeeCents) {
    return "Full service payment";
  }

  if (balanceDueCents > 0 && invoice.amountCents >= balanceDueCents) {
    return "Remaining balance (full payoff)";
  }

  return "Partial payment toward service";
};

const sortInvoicesChronologically = (
  invoices: ServiceInvoice[]
): ServiceInvoice[] =>
  [...invoices].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );

/** Use the in-memory invoice when building context before/without a storage refresh. */
export const replaceInvoiceInList = (
  invoices: ServiceInvoice[],
  current: ServiceInvoice
): ServiceInvoice[] => {
  const index = invoices.findIndex(
    (invoice) => invoice.invoiceId === current.invoiceId
  );
  if (index === -1) return [...invoices, current];
  const next = [...invoices];
  next[index] = current;
  return next;
};

export const buildInvoiceServiceContext = (
  service: ClientService,
  invoices: ServiceInvoice[],
  currentInvoice: ServiceInvoice
): InvoiceServiceContext => {
  const paidCents = sumPaidInvoiceCents(invoices);
  const paidTotalCents = sumPaidInvoiceTotalCents(invoices);
  const balanceDueCents = computeServiceBalanceDueCents(
    service.totalFeeCents,
    invoices
  );

  const paymentHistory = sortInvoicesChronologically(invoices).map((entry) => {
    const isCurrent = entry.invoiceId === currentInvoice.invoiceId;
    const statusLabel =
      isCurrent && entry.status === "draft"
        ? "Unpaid"
        : formatClientInvoiceStatusLabel(entry.status);
    return {
      invoiceId: entry.invoiceId,
      invoiceNumber: entry.invoiceNumber,
      description: entry.description || service.title,
      amountCents: entry.amountCents,
      statusLabel,
      paidAt: entry.paidAt,
      isCurrent,
    };
  });

  const paymentStatusLabel =
    currentInvoice.status === "draft"
      ? "Unpaid"
      : formatClientInvoiceStatusLabel(currentInvoice.status);

  return {
    totalFeeCents: service.totalFeeCents,
    paidCents,
    paidTotalCents,
    balanceDueCents,
    paymentTypeLabel: resolveInvoicePaymentTypeLabel(
      currentInvoice,
      service,
      balanceDueCents
    ),
    paymentStatusLabel,
    paymentHistory,
  };
};

export const buildPaidInvoiceInstructions = (invoice: ServiceInvoice): string => {
  if (invoice.paidAt) {
    const paidDate = new Date(invoice.paidAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return `This invoice is paid. Payment received on ${paidDate}. No payment is due.`;
  }
  return "This invoice is paid. No payment is due.";
};
