import { createHmac, timingSafeEqual } from "crypto";
import { toAbsoluteUrl } from "@/config/siteUrl";

export type InvoiceAccessTokenPayload = {
  clientId: string;
  serviceId: string;
  invoiceId: string;
  invoiceNumber: string;
  expiresAt: string;
};

const INVOICE_ACCESS_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export const getInvoiceAccessSecret = (): string =>
  process.env.CLIENT_INVOICE_ACCESS_SECRET?.trim() ||
  process.env.CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET?.trim() ||
  process.env.GIFT_CARD_ORDER_WEBHOOK_SECRET?.trim() ||
  "client-invoice-access-dev-only";

export const resolveInvoiceAccessExpiry = (
  fromIso: string = new Date().toISOString()
): string => new Date(Date.parse(fromIso) + INVOICE_ACCESS_TTL_MS).toISOString();

const signPayload = (payloadEncoded: string): string =>
  createHmac("sha256", getInvoiceAccessSecret())
    .update(payloadEncoded)
    .digest("base64url");

export const createInvoiceAccessToken = (input: {
  clientId: string;
  serviceId: string;
  invoiceId: string;
  invoiceNumber: string;
  expiresAt?: string;
}): string => {
  const payload: InvoiceAccessTokenPayload = {
    clientId: input.clientId,
    serviceId: input.serviceId,
    invoiceId: input.invoiceId,
    invoiceNumber: input.invoiceNumber,
    expiresAt: input.expiresAt ?? resolveInvoiceAccessExpiry(),
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadEncoded}.${signPayload(payloadEncoded)}`;
};

export const verifyInvoiceAccessToken = (
  token: string
): InvoiceAccessTokenPayload | null => {
  const trimmed = token.trim();
  const separator = trimmed.lastIndexOf(".");
  if (separator <= 0) return null;

  const payloadEncoded = trimmed.slice(0, separator);
  const signature = trimmed.slice(separator + 1);
  if (!payloadEncoded || !signature) return null;

  const expected = signPayload(payloadEncoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadEncoded, "base64url").toString("utf8")
    ) as InvoiceAccessTokenPayload;

    if (
      !payload?.clientId ||
      !payload.serviceId ||
      !payload.invoiceId ||
      !payload.invoiceNumber ||
      !payload.expiresAt ||
      Number.isNaN(Date.parse(payload.expiresAt))
    ) {
      return null;
    }

    if (Date.parse(payload.expiresAt) < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const buildInvoiceDownloadPath = (token: string): string =>
  `/invoice/${encodeURIComponent(token)}`;

export const buildInvoiceDownloadUrl = (input: {
  clientId: string;
  serviceId: string;
  invoiceId: string;
  invoiceNumber: string;
  origin?: string;
  expiresAt?: string;
}): { url: string; token: string; expiresAt: string } => {
  const expiresAt = input.expiresAt ?? resolveInvoiceAccessExpiry();
  const token = createInvoiceAccessToken({ ...input, expiresAt });
  const path = buildInvoiceDownloadPath(token);
  const url = input.origin
    ? `${input.origin.replace(/\/$/, "")}${path}`
    : toAbsoluteUrl(path);
  return { url, token, expiresAt };
};
