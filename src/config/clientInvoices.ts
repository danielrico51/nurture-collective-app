import { classRegistrationPaymentConfig } from "@/config/classRegistrations";
import { brands } from "@/content/site";

const readSiteUrl = (): string => {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://www.nesting-place.com";
};

export const clientInvoiceConfig = {
  siteUrl: readSiteUrl(),
  logoUrl: `${readSiteUrl()}/branding/nesting-place-logo.png`,
  brandName: brands.nestingPlace.name,
  brandEmail: brands.nestingPlace.email,
  venmoHandle:
    process.env.CLIENT_INVOICE_VENMO_HANDLE?.trim() ||
    classRegistrationPaymentConfig.venmoHandle ||
    "@thenestingplace",
  zelleEmail:
    process.env.CLIENT_INVOICE_ZELLE_EMAIL?.trim() ||
    "thenestingplacenj@gmail.com",
} as const;

/** Public origin for client-facing invoice links (PDF page, payment redirects). */
export const resolveClientInvoicePublicOrigin = (
  requestOrigin?: string
): string => {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  const normalizedConfigured = configured?.replace(/\/$/, "");
  const normalizedRequest = requestOrigin?.trim().replace(/\/$/, "") ?? "";
  const isLocalRequest = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    normalizedRequest
  );

  // Admin on localhost should not put localhost in emails when a public URL is configured.
  if (isLocalRequest && normalizedConfigured) {
    return normalizedConfigured;
  }

  if (normalizedRequest) return normalizedRequest;
  if (normalizedConfigured) return normalizedConfigured;
  return clientInvoiceConfig.siteUrl;
};
