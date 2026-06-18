import "server-only";

import { readServiceInvoice } from "@/lib/client-services/storage";
import { verifyInvoiceAccessToken } from "@/lib/invoices/accessToken";
import { readInvoiceHtmlDocument } from "@/lib/invoices/persistDocument";
import type { ServiceInvoice } from "@/types/clientService";

export interface PublicInvoiceDocument {
  invoice: ServiceInvoice;
  html: string;
  expiresAt: string;
}

export const getPublicInvoiceDocument = async (
  token: string
): Promise<PublicInvoiceDocument | null> => {
  const payload = verifyInvoiceAccessToken(token);
  if (!payload) return null;

  const invoice = await readServiceInvoice(
    payload.clientId,
    payload.serviceId,
    payload.invoiceId
  );
  if (!invoice || invoice.invoiceNumber !== payload.invoiceNumber) {
    return null;
  }

  if (invoice.status === "draft" || invoice.status === "cancelled") {
    return null;
  }

  const html = await readInvoiceHtmlDocument({
    clientId: payload.clientId,
    serviceId: payload.serviceId,
    invoiceId: payload.invoiceId,
  });
  if (!html) return null;

  return {
    invoice,
    html,
    expiresAt: payload.expiresAt,
  };
};

export const extractInvoiceHtmlBody = (html: string): string => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch?.[1]?.trim() ?? html;
};
