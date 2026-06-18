import "server-only";

import { getClientById } from "@/lib/clients/storage";
import { sendClientEmail } from "@/lib/clients/communications";
import {
  listInvoicesForService,
  readClientService,
} from "@/lib/client-services/storage";
import {
  buildInvoiceEmailSubject,
  buildInvoiceEmailHtml,
  buildInvoiceHtmlDocument,
  buildInvoicePlainText,
} from "@/lib/invoices/buildDocument";
import { persistInvoiceHtmlDocument } from "@/lib/invoices/persistDocument";
import { resolveClientInvoicePublicOrigin } from "@/config/clientInvoices";
import { buildInvoiceDownloadUrl, resolveInvoiceAccessExpiry } from "@/lib/invoices/accessToken";
import { resolveServiceInvoicePayment, ServiceInvoicePaymentError } from "@/lib/invoices/paymentLinks";
import {
  buildInvoiceServiceContext,
  buildPaidInvoiceInstructions,
} from "@/lib/invoices/serviceContext";
import type { ClientRecord } from "@/types/client";
import type {
  ClientService,
  InvoiceDispatchActor,
  ServiceInvoice,
} from "@/types/clientService";

export class InvoiceDispatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceDispatchError";
  }
}

const resolveInitialSentStatus = (invoice: ServiceInvoice): ServiceInvoice["status"] =>
  invoice.paymentMethod === "quickbooks" || invoice.paymentMethod === "stripe"
    ? "pending_payment"
    : "sent";

export const dispatchServiceInvoice = async (input: {
  clientId: string;
  serviceId: string;
  invoice: ServiceInvoice;
  actor: InvoiceDispatchActor;
  origin: string;
  resend?: boolean;
}): Promise<ServiceInvoice> => {
  const client = await getClientById(input.clientId);
  if (!client) throw new InvoiceDispatchError("Client not found");
  if (!client.email?.trim()) {
    throw new InvoiceDispatchError("Client has no email address");
  }

  const service = await readClientService(input.clientId, input.serviceId);
  if (!service) throw new InvoiceDispatchError("Service not found");

  const serviceInvoices = await listInvoicesForService(
    input.clientId,
    input.serviceId
  );
  const serviceContext = buildInvoiceServiceContext(
    service,
    serviceInvoices,
    input.invoice
  );

  const isPaid = input.invoice.status === "paid";
  const isResend = Boolean(input.resend);

  const payment = isPaid
    ? {
        paymentLink: null,
        paymentInstructions: buildPaidInvoiceInstructions(input.invoice),
        quickbooks: input.invoice.quickbooks,
        stripe: input.invoice.stripe,
      }
    : await resolveServiceInvoicePayment({
        invoice: input.invoice,
        service,
        client,
        origin: input.origin,
      }).catch((error) => {
        if (error instanceof ServiceInvoicePaymentError) {
          throw new InvoiceDispatchError(error.message);
        }
        throw error;
      });

  const documentInput = {
    invoice: input.invoice,
    service,
    client,
    paymentLink: payment.paymentLink,
    paymentInstructions: payment.paymentInstructions,
    serviceContext,
    pdfDownloadUrl: null as string | null,
    isResend,
  };

  const now = new Date().toISOString();
  const publicOrigin = resolveClientInvoicePublicOrigin(input.origin);
  const { url: pdfDownloadUrl, expiresAt: pdfAccessExpiresAt } =
    buildInvoiceDownloadUrl({
      clientId: input.clientId,
      serviceId: input.serviceId,
      invoiceId: input.invoice.invoiceId,
      invoiceNumber: input.invoice.invoiceNumber,
      origin: publicOrigin,
      expiresAt: resolveInvoiceAccessExpiry(now),
    });
  documentInput.pdfDownloadUrl = pdfDownloadUrl;

  const htmlDocument = buildInvoiceHtmlDocument(documentInput);
  const emailHtml = buildInvoiceEmailHtml(documentInput);
  const text = buildInvoicePlainText(documentInput);
  const documentStorageKey = await persistInvoiceHtmlDocument({
    clientId: input.clientId,
    serviceId: input.serviceId,
    invoiceId: input.invoice.invoiceId,
    html: htmlDocument,
  });

  let lastEmailError: string | null = null;

  try {
    await sendClientEmail({
      client,
      subject: buildInvoiceEmailSubject(input.invoice.invoiceNumber),
      body: text,
      html: emailHtml,
      templateId: isResend ? "service_invoice_resend" : "service_invoice",
      sentBy: input.actor.sub,
      sentByEmail: input.actor.email,
    });
  } catch (error) {
    lastEmailError =
      error instanceof Error ? error.message : "Invoice email send failed";
    throw new InvoiceDispatchError(lastEmailError);
  }

  const status = isPaid
    ? "paid"
    : isResend
      ? input.invoice.status
      : resolveInitialSentStatus(input.invoice);

  return {
    ...input.invoice,
    customerName: client.name,
    customerEmail: client.email.trim().toLowerCase(),
    paymentInstructions: isPaid
      ? input.invoice.paymentInstructions
      : payment.paymentInstructions,
    paymentLink: isPaid ? input.invoice.paymentLink : payment.paymentLink,
    quickbooks: isPaid ? input.invoice.quickbooks : payment.quickbooks,
    stripe: isPaid ? input.invoice.stripe : payment.stripe,
    documentStorageKey,
    pdfDownloadUrl,
    pdfAccessExpiresAt,
    lastEmailError,
    status,
    sentAt: input.invoice.sentAt ?? now,
    updatedAt: now,
  };
};

export const buildEmptyInvoiceContactFields = (
  client: ClientRecord | null
): Pick<
  ServiceInvoice,
  | "customerName"
  | "customerEmail"
  | "paymentInstructions"
  | "paymentLink"
  | "documentStorageKey"
  | "pdfDownloadUrl"
  | "pdfAccessExpiresAt"
  | "lastEmailError"
> => ({
  customerName: client?.name ?? "",
  customerEmail: client?.email?.trim().toLowerCase() ?? "",
  paymentInstructions: "",
  paymentLink: null,
  documentStorageKey: null,
  pdfDownloadUrl: null,
  pdfAccessExpiresAt: null,
  lastEmailError: null,
});
