import { resolveClientInvoicePublicOrigin } from "@/config/clientInvoices";
import { listClientServicesWithInvoices } from "@/lib/client-services/storage";
import { findClientForMember } from "@/lib/clients/storage";
import { buildInvoiceDownloadUrl } from "@/lib/invoices/accessToken";
import type {
  ClientServiceWithInvoices,
  ServiceInvoice,
  ServiceInvoiceQuickBooksRef,
  ServiceInvoiceStatus,
} from "@/types/clientService";
import type {
  MemberPaymentStatus,
  MemberPurchase,
  MemberPurchaseQuickBooks,
} from "@/types/memberPurchases";

const MEMBER_VISIBLE_INVOICE_STATUSES: ServiceInvoiceStatus[] = [
  "sent",
  "pending_payment",
  "paid",
  "refunded",
];

export const mapServiceInvoicePaymentStatus = (
  status: ServiceInvoiceStatus
): MemberPaymentStatus => {
  switch (status) {
    case "paid":
      return "paid";
    case "pending_payment":
      return "pending_payment";
    case "sent":
      return "invoice_sent";
    case "refunded":
      return "refunded";
    case "cancelled":
      return "cancelled";
    default:
      return "other";
  }
};

const mapServiceInvoiceQuickBooks = (
  qb: ServiceInvoiceQuickBooksRef | null | undefined
): MemberPurchaseQuickBooks => {
  if (!qb) return { syncStatus: "not_applicable" };

  if (qb.salesReceiptId || qb.salesReceiptNumber) {
    return {
      syncStatus: qb.syncStatus ?? "pending",
      lastSyncAt: qb.lastSyncAt,
      lastError: qb.lastError,
      documentType: "sales_receipt",
      documentId: qb.salesReceiptId,
      documentNumber: qb.salesReceiptNumber,
    };
  }

  if (qb.invoiceId) {
    return {
      syncStatus: qb.syncStatus ?? "pending",
      lastSyncAt: qb.lastSyncAt,
      lastError: qb.lastError,
      documentType: "invoice",
      documentId: qb.invoiceId,
      documentNumber: qb.invoiceNumber,
    };
  }

  if (qb.syncStatus) {
    return {
      syncStatus: qb.syncStatus,
      lastSyncAt: qb.lastSyncAt,
      lastError: qb.lastError,
    };
  }

  return { syncStatus: "not_applicable" };
};

export const resolveMemberInvoicePrintUrl = (
  invoice: ServiceInvoice,
  clientId: string
): string => {
  const now = Date.now();
  if (
    invoice.pdfDownloadUrl &&
    invoice.pdfAccessExpiresAt &&
    Date.parse(invoice.pdfAccessExpiresAt) > now
  ) {
    return invoice.pdfDownloadUrl;
  }

  return buildInvoiceDownloadUrl({
    clientId,
    serviceId: invoice.serviceId,
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    origin: resolveClientInvoicePublicOrigin(),
  }).url;
};

const installmentLabel = (invoice: ServiceInvoice): string | undefined => {
  if (!invoice.installmentIndex) return undefined;
  return invoice.installmentTotal
    ? `Installment ${invoice.installmentIndex} of ${invoice.installmentTotal}`
    : `Installment ${invoice.installmentIndex}`;
};

export const serviceInvoiceToMemberPurchase = (
  service: ClientServiceWithInvoices,
  invoice: ServiceInvoice,
  clientId: string
): MemberPurchase => {
  const installment = installmentLabel(invoice);

  return {
    id: invoice.invoiceId,
    kind: "client_invoice",
    title: service.title,
    description: invoice.description || installment,
    amountCents: invoice.amountCents,
    currency: "USD",
    createdAt: invoice.sentAt ?? invoice.createdAt,
    paidAt: invoice.paidAt ?? undefined,
    paymentStatus: mapServiceInvoicePaymentStatus(invoice.status),
    paymentProvider: invoice.paymentMethod,
    quickbooks: mapServiceInvoiceQuickBooks(invoice.quickbooks),
    invoiceNumber: invoice.invoiceNumber,
    printUrl: resolveMemberInvoicePrintUrl(invoice, clientId),
    dueDate: invoice.dueDate,
    serviceTitle: service.title,
    installmentLabel: installment,
    subtotalCents: invoice.subtotalCents,
    processingFeeCents: invoice.processingFeeCents,
  };
};

export const listMemberClientInvoices = async (input: {
  email: string;
  userId: string;
}): Promise<{ clientLinked: boolean; purchases: MemberPurchase[] }> => {
  const client = await findClientForMember({
    cognitoSub: input.userId,
    email: input.email,
  });
  if (!client) {
    return { clientLinked: false, purchases: [] };
  }

  const services = await listClientServicesWithInvoices(client.clientId);
  const purchases: MemberPurchase[] = [];

  for (const service of services) {
    for (const invoice of service.invoices) {
      if (!MEMBER_VISIBLE_INVOICE_STATUSES.includes(invoice.status)) continue;
      purchases.push(
        serviceInvoiceToMemberPurchase(service, invoice, client.clientId)
      );
    }
  }

  return {
    clientLinked: true,
    purchases: purchases.sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    ),
  };
};
