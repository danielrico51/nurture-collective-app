import { clientInvoiceConfig } from "@/config/clientInvoices";

/** Official payment details from The Nesting Place payment methods sheet. */
export const clientInvoicePaymentDetails = {
  venmoHandle: clientInvoiceConfig.venmoHandle,
  venmoProfileUrl: clientInvoiceConfig.venmoProfileUrl,
  zelleHandle: clientInvoiceConfig.zelleHandle,
  venmoQrPath: "/branding/payments/venmo-qr.jpg",
  zelleQrPath: "/branding/payments/zelle-qr.jpg",
  ach: {
    bankName: clientInvoiceConfig.achBankName,
    routingNumber: clientInvoiceConfig.achRoutingNumber,
    accountNumber: clientInvoiceConfig.achAccountNumber,
    accountName: clientInvoiceConfig.achAccountName,
    accountType: clientInvoiceConfig.achAccountType,
  },
  cardDebit: {
    email: clientInvoiceConfig.brandEmail,
    processingFeeNote: "A 3% credit card processing fee applies.",
  },
} as const;

export const clientInvoicePaymentAssetUrl = (path: string): string =>
  `${clientInvoiceConfig.siteUrl.replace(/\/$/, "")}${path}`;
