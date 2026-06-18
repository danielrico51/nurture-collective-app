import "server-only";

import { clientInvoiceConfig } from "@/config/clientInvoices";
import { serverQuickBooksConfig } from "@/config/quickbooks";
import { buildVenmoPaymentUrl } from "@/lib/classRegistrations/payments";
import { syncServiceInvoiceToQuickBooks } from "@/lib/invoices/quickbooksSync";
import { createServiceInvoiceStripeCheckout } from "@/lib/invoices/stripeCheckout";
import { getPaymentMethod } from "@/config/paymentMethods";
import type { ClientRecord } from "@/types/client";
import type {
  ClientService,
  ServiceInvoice,
  ServiceInvoiceQuickBooksRef,
  ServiceInvoiceStripeRef,
} from "@/types/clientService";

export interface ResolvedInvoicePayment {
  paymentLink: string | null;
  paymentInstructions: string;
  quickbooks: ServiceInvoiceQuickBooksRef | null;
  stripe: ServiceInvoiceStripeRef | null;
}

/** Thrown when invoice send must be blocked (admin-facing message). */
export class ServiceInvoicePaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceInvoicePaymentError";
  }
}

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const buildVenmoInstructions = (
  invoice: ServiceInvoice,
  paymentLink: string
): string =>
  `Pay ${formatMoney(invoice.amountCents)} via Venmo to ${clientInvoiceConfig.venmoHandle}. Include invoice ${invoice.invoiceNumber} in the payment note.`;

const buildZelleInstructions = (invoice: ServiceInvoice): string =>
  [
    `Pay ${formatMoney(invoice.amountCents)} via Zelle to ${clientInvoiceConfig.zelleEmail}.`,
    `Include invoice ${invoice.invoiceNumber} in the memo.`,
    `Service: ${invoice.description}`,
  ].join(" ");

export const resolveServiceInvoicePayment = async (input: {
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
  origin: string;
}): Promise<ResolvedInvoicePayment> => {
  const method = getPaymentMethod(input.invoice.paymentMethod);
  if (!method) {
    throw new Error(`Unknown payment method: ${input.invoice.paymentMethod}`);
  }

  if (method.id === "venmo") {
    const handle = clientInvoiceConfig.venmoHandle.replace(/^@/, "");
    const paymentLink = buildVenmoPaymentUrl({
      handle,
      amountCents: input.invoice.amountCents,
      note: `${input.invoice.invoiceNumber} ${input.service.title}`.slice(0, 200),
    });
    return {
      paymentLink,
      paymentInstructions: buildVenmoInstructions(input.invoice, paymentLink),
      quickbooks: null,
      stripe: null,
    };
  }

  if (method.id === "zelle") {
    return {
      paymentLink: null,
      paymentInstructions: buildZelleInstructions(input.invoice),
      quickbooks: null,
      stripe: null,
    };
  }

  if (method.id === "quickbooks") {
    const mode = serverQuickBooksConfig.syncMode;
    if (mode !== "direct" && mode !== "hybrid") {
      throw new ServiceInvoicePaymentError(
        "QuickBooks invoices from the CRM require BILLING_SYNC_MODE=direct (or hybrid). " +
          "Either set that env var and reconnect QuickBooks, or use Venmo/Zelle/Stripe for this invoice."
      );
    }

    const quickbooks = await syncServiceInvoiceToQuickBooks({
      invoice: input.invoice,
      service: input.service,
      client: input.client,
    });

    const paymentLink =
      quickbooks.paymentLink ?? input.invoice.paymentLink ?? null;
    const paymentInstructions = paymentLink
      ? `Pay ${formatMoney(input.invoice.amountCents)} securely online.`
      : `Your invoice total is ${formatMoney(input.invoice.amountCents)}. Our team will follow up with a secure online payment link shortly.`;

    return {
      paymentLink,
      paymentInstructions,
      quickbooks,
      stripe: null,
    };
  }

  if (method.id === "stripe") {
    const stripe = await createServiceInvoiceStripeCheckout({
      invoice: input.invoice,
      service: input.service,
      client: input.client,
      origin: input.origin,
    });

    const paymentLink = stripe.checkoutUrl ?? null;
    const paymentInstructions = paymentLink
      ? `Pay ${formatMoney(input.invoice.amountCents)} securely online.`
      : "Online payment link is being prepared — we will follow up shortly.";

    return {
      paymentLink,
      paymentInstructions,
      quickbooks: null,
      stripe,
    };
  }

  return {
    paymentLink: null,
    paymentInstructions: `Pay ${formatMoney(input.invoice.amountCents)} using ${method.label}. Reference invoice ${input.invoice.invoiceNumber}.`,
    quickbooks: null,
    stripe: null,
  };
};
