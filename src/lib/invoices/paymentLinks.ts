import "server-only";

import { clientInvoiceConfig } from "@/config/clientInvoices";
import { getPaymentMethod } from "@/config/paymentMethods";
import { buildVenmoPaymentUrl } from "@/lib/classRegistrations/payments";
import {
  buildAchInvoiceInstructions,
  buildVenmoInvoiceInstructions,
  buildZelleInvoiceInstructions,
} from "@/lib/invoices/paymentInstructions";
import { normalizeStoredInvoiceAmounts } from "@/lib/invoices/processingFee";
import {
  serviceInvoiceQuickBooksSyncEnabled,
  shouldCreateQuickBooksInvoiceOnSend,
  syncServiceInvoiceToQuickBooks,
} from "@/lib/invoices/quickbooksSync";
import { createServiceInvoiceStripeCheckout } from "@/lib/invoices/stripeCheckout";
import { readQuickBooksTokens } from "@/lib/integrations/quickbooks/tokenStorage";
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
  client: ClientRecord
): string => buildVenmoInvoiceInstructions(invoice, client);

const buildZelleInstructions = (
  invoice: ServiceInvoice,
  client: ClientRecord
): string => buildZelleInvoiceInstructions(invoice, client);

const buildFailedQuickBooksRef = (
  existing: ServiceInvoiceQuickBooksRef | null,
  message: string
): ServiceInvoiceQuickBooksRef => ({
  ...existing,
  syncStatus: "failed",
  lastError: message,
  lastSyncAt: new Date().toISOString(),
});

const attachQuickBooksInvoiceOnSend = async (input: {
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
  result: ResolvedInvoicePayment;
  allowOnlinePayments: boolean;
  paymentMethodLabel: string;
  required: boolean;
}): Promise<ResolvedInvoicePayment> => {
  if (
    !serviceInvoiceQuickBooksSyncEnabled() ||
    !shouldCreateQuickBooksInvoiceOnSend(input.invoice)
  ) {
    return input.result;
  }

  const tokens = await readQuickBooksTokens();
  if (!tokens?.refreshToken) {
    const message = "QuickBooks is not connected";
    if (input.required) {
      throw new ServiceInvoicePaymentError(message);
    }
    console.warn("[service-invoices] Skipping QuickBooks sync on send:", message);
    return {
      ...input.result,
      quickbooks: buildFailedQuickBooksRef(input.invoice.quickbooks, message),
    };
  }

  try {
    const quickbooks = await syncServiceInvoiceToQuickBooks({
      invoice: input.invoice,
      service: input.service,
      client: input.client,
      allowOnlinePayments: input.allowOnlinePayments,
      paymentMethodLabel: input.paymentMethodLabel,
    });
    return { ...input.result, quickbooks };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "QuickBooks sync failed";
    if (input.required) {
      throw new ServiceInvoicePaymentError(message);
    }
    console.error("[service-invoices] QuickBooks sync on send failed:", error);
    return {
      ...input.result,
      quickbooks: buildFailedQuickBooksRef(input.invoice.quickbooks, message),
    };
  }
};

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
    return attachQuickBooksInvoiceOnSend({
      ...input,
      allowOnlinePayments: false,
      paymentMethodLabel: method.label,
      required: false,
      result: {
        paymentLink,
        paymentInstructions: buildVenmoInstructions(input.invoice, input.client),
        quickbooks: null,
        stripe: null,
      },
    });
  }

  if (method.id === "zelle") {
    return attachQuickBooksInvoiceOnSend({
      ...input,
      allowOnlinePayments: false,
      paymentMethodLabel: method.label,
      required: false,
      result: {
        paymentLink: null,
        paymentInstructions: buildZelleInstructions(input.invoice, input.client),
        quickbooks: null,
        stripe: null,
      },
    });
  }

  if (method.id === "ach") {
    return attachQuickBooksInvoiceOnSend({
      ...input,
      allowOnlinePayments: false,
      paymentMethodLabel: method.label,
      required: false,
      result: {
        paymentLink: null,
        paymentInstructions: buildAchInvoiceInstructions(
          input.invoice,
          input.client
        ),
        quickbooks: null,
        stripe: null,
      },
    });
  }

  if (method.id === "quickbooks") {
    if (!serviceInvoiceQuickBooksSyncEnabled()) {
      throw new ServiceInvoicePaymentError(
        "QuickBooks invoices from the CRM require BILLING_SYNC_MODE=direct (or hybrid). " +
          "Either set that env var and reconnect QuickBooks, or use Venmo/Zelle for this invoice."
      );
    }

    try {
      const quickbooks = await syncServiceInvoiceToQuickBooks({
        invoice: input.invoice,
        service: input.service,
        client: input.client,
        allowOnlinePayments: true,
        paymentMethodLabel: method.label,
      });

      const paymentLink =
        quickbooks.paymentLink ?? input.invoice.paymentLink ?? null;
      const amounts = normalizeStoredInvoiceAmounts(input.invoice);
      const paymentInstructions = paymentLink
        ? amounts.processingFeeCents > 0
          ? `Pay ${formatMoney(amounts.amountCents)} securely online (${formatMoney(amounts.subtotalCents)} service + ${formatMoney(amounts.processingFeeCents)} processing fee).`
          : `Pay ${formatMoney(amounts.amountCents)} securely online.`
        : amounts.processingFeeCents > 0
          ? `Your invoice total is ${formatMoney(amounts.amountCents)} (${formatMoney(amounts.subtotalCents)} service + ${formatMoney(amounts.processingFeeCents)} processing fee). Our team will follow up with a secure online payment link shortly.`
          : `Your invoice total is ${formatMoney(amounts.amountCents)}. Our team will follow up with a secure online payment link shortly.`;

      return {
        paymentLink,
        paymentInstructions,
        quickbooks,
        stripe: null,
      };
    } catch (error) {
      throw new ServiceInvoicePaymentError(
        error instanceof Error ? error.message : "QuickBooks sync failed"
      );
    }
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

  return attachQuickBooksInvoiceOnSend({
    ...input,
    allowOnlinePayments: false,
    paymentMethodLabel: method.label,
    required: false,
    result: {
      paymentLink: null,
      paymentInstructions: `Pay ${formatMoney(input.invoice.amountCents)} using ${method.label}. Reference invoice ${input.invoice.invoiceNumber}.`,
      quickbooks: null,
      stripe: null,
    },
  });
};
