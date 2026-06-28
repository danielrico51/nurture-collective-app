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
  replaceInvoiceInList,
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

type InvoiceDocumentContext = {
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
  serviceContext: ReturnType<typeof buildInvoiceServiceContext>;
  paymentLink: string | null;
  paymentInstructions: string;
  quickbooks: ServiceInvoice["quickbooks"];
  stripe: ServiceInvoice["stripe"];
  pdfDownloadUrl: string;
  pdfAccessExpiresAt: string;
  documentStorageKey: string;
  now: string;
};

const buildInvoiceDocumentContext = async (input: {
  clientId: string;
  serviceId: string;
  invoice: ServiceInvoice;
  origin: string;
  asPaid?: boolean;
  resolvePaymentLinks?: boolean;
}): Promise<InvoiceDocumentContext> => {
  const client = await getClientById(input.clientId);
  if (!client) throw new InvoiceDispatchError("Client not found");

  const service = await readClientService(input.clientId, input.serviceId);
  if (!service) throw new InvoiceDispatchError("Service not found");

  const serviceInvoices = await listInvoicesForService(
    input.clientId,
    input.serviceId
  );
  const invoicesForContext = replaceInvoiceInList(
    serviceInvoices,
    input.invoice
  );
  const serviceContext = buildInvoiceServiceContext(
    service,
    invoicesForContext,
    input.invoice
  );

  const asPaid = Boolean(input.asPaid);
  const resolvePaymentLinks = input.resolvePaymentLinks ?? !asPaid;

  const payment = asPaid
    ? {
        paymentLink: null,
        paymentInstructions: buildPaidInvoiceInstructions(input.invoice),
        quickbooks: input.invoice.quickbooks,
        stripe: input.invoice.stripe,
      }
    : resolvePaymentLinks
      ? await resolveServiceInvoicePayment({
          invoice: input.invoice,
          service,
          client,
          origin: input.origin,
        }).catch((error) => {
          if (error instanceof ServiceInvoicePaymentError) {
            throw new InvoiceDispatchError(error.message);
          }
          throw error;
        })
      : {
          paymentLink: input.invoice.paymentLink,
          paymentInstructions: input.invoice.paymentInstructions,
          quickbooks: input.invoice.quickbooks,
          stripe: input.invoice.stripe,
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

  const htmlDocument = buildInvoiceHtmlDocument({
    invoice: input.invoice,
    service,
    client,
    paymentLink: payment.paymentLink,
    paymentInstructions: payment.paymentInstructions,
    serviceContext,
    pdfDownloadUrl,
    isResend: false,
  });

  const documentStorageKey = await persistInvoiceHtmlDocument({
    clientId: input.clientId,
    serviceId: input.serviceId,
    invoiceId: input.invoice.invoiceId,
    html: htmlDocument,
  });

  return {
    invoice: input.invoice,
    service,
    client,
    serviceContext,
    paymentLink: payment.paymentLink,
    paymentInstructions: payment.paymentInstructions,
    quickbooks: payment.quickbooks,
    stripe: payment.stripe,
    pdfDownloadUrl,
    pdfAccessExpiresAt,
    documentStorageKey,
    now,
  };
};

/** Build and store invoice HTML/PDF metadata without emailing the client. */
export const generateServiceInvoiceDocument = async (input: {
  clientId: string;
  serviceId: string;
  invoice: ServiceInvoice;
  origin: string;
  asPaid?: boolean;
  resolvePaymentLinks?: boolean;
}): Promise<ServiceInvoice> => {
  const context = await buildInvoiceDocumentContext(input);
  const asPaid = Boolean(input.asPaid);

  return {
    ...context.invoice,
    customerName: context.client.name,
    customerEmail: context.client.email?.trim().toLowerCase() ?? "",
    paymentInstructions: asPaid
      ? context.invoice.paymentInstructions
      : context.paymentInstructions,
    paymentLink: asPaid ? context.invoice.paymentLink : context.paymentLink,
    documentStorageKey: context.documentStorageKey,
    pdfDownloadUrl: context.pdfDownloadUrl,
    pdfAccessExpiresAt: context.pdfAccessExpiresAt,
    lastEmailError: null,
    updatedAt: context.now,
  };
};

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

  const isPaid = input.invoice.status === "paid";
  const isResend = Boolean(input.resend);

  const context = await buildInvoiceDocumentContext({
    clientId: input.clientId,
    serviceId: input.serviceId,
    invoice: input.invoice,
    origin: input.origin,
    asPaid: isPaid,
    resolvePaymentLinks: !isPaid,
  });

  const documentInput = {
    invoice: input.invoice,
    service: context.service,
    client: context.client,
    paymentLink: context.paymentLink,
    paymentInstructions: context.paymentInstructions,
    serviceContext: context.serviceContext,
    pdfDownloadUrl: context.pdfDownloadUrl,
    isResend,
  };

  const emailHtml = buildInvoiceEmailHtml(documentInput);
  const text = buildInvoicePlainText(documentInput);

  let lastEmailError: string | null = null;

  try {
    await sendClientEmail({
      client: context.client,
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
    customerName: context.client.name,
    customerEmail: context.client.email.trim().toLowerCase(),
    paymentInstructions: isPaid
      ? input.invoice.paymentInstructions
      : context.paymentInstructions,
    paymentLink: isPaid ? input.invoice.paymentLink : context.paymentLink,
    quickbooks: isPaid ? input.invoice.quickbooks : context.quickbooks,
    stripe: isPaid ? input.invoice.stripe : context.stripe,
    documentStorageKey: context.documentStorageKey,
    pdfDownloadUrl: context.pdfDownloadUrl,
    pdfAccessExpiresAt: context.pdfAccessExpiresAt,
    lastEmailError,
    status,
    sentAt: input.invoice.sentAt ?? context.now,
    updatedAt: context.now,
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
