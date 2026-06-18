import {
  buildClientRootPrefix,
  buildClientsCrmRootPrefix,
  sanitizeClientSegment,
} from "@/lib/clients/paths";

export const CLIENT_SERVICE_FILENAME = "service.json";
export const SERVICE_INVOICE_FILENAME = "invoice.json";
export const INVOICE_SEQUENCE_FILENAME = "invoice-sequence.json";

export const buildClientServiceKey = (
  clientId: string,
  serviceId: string
): string =>
  `${buildClientRootPrefix(clientId)}services/service_id=${sanitizeClientSegment(serviceId)}/${CLIENT_SERVICE_FILENAME}`;

export const buildClientServiceListPrefix = (clientId: string): string =>
  `${buildClientRootPrefix(clientId)}services/`;

export const buildServiceInvoiceKey = (
  clientId: string,
  serviceId: string,
  invoiceId: string
): string =>
  `${buildClientRootPrefix(clientId)}services/service_id=${sanitizeClientSegment(serviceId)}/invoices/invoice_id=${sanitizeClientSegment(invoiceId)}/${SERVICE_INVOICE_FILENAME}`;

export const buildServiceInvoiceListPrefix = (
  clientId: string,
  serviceId: string
): string =>
  `${buildClientRootPrefix(clientId)}services/service_id=${sanitizeClientSegment(serviceId)}/invoices/`;

export const parseServiceIdFromKey = (key: string): string | null => {
  const match = key.match(/services\/service_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const parseInvoiceIdFromKey = (key: string): string | null => {
  const match = key.match(/invoices\/invoice_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const buildInvoiceSequenceKey = (): string =>
  `${buildClientsCrmRootPrefix()}billing/${INVOICE_SEQUENCE_FILENAME}`;
