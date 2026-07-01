import { isEngagementPaymentMethod, isKnownPaymentMethod } from "@/config/paymentMethods";
import {
  cancelServiceInvoice,
  createServiceInvoice,
  markServiceInvoicePaid,
  readServiceInvoice,
  type ServiceInvoiceDispatchOptions,
} from "@/lib/client-services/storage";
import { savePaymentExpectation } from "@/lib/schedule/expectationStorage";
import { invoiceMatchesExpectation } from "@/lib/schedule/expectationInvoiceSync";
import { resolveExpectationQuickBooksIncomeCategory } from "@/lib/invoices/quickbooksIncomeRouting";
import type {
  PaymentMethodId,
  ServiceInvoice,
  ServiceInvoiceStatus,
} from "@/types/clientService";
import type {
  ClientPaymentExpectation,
  ServiceEngagement,
} from "@/types/serviceEngagement";

export class ExpectationBillingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpectationBillingError";
  }
}

export const resolveExpectationPaymentMethod = (
  preferred: PaymentMethodId | null | undefined
): PaymentMethodId => {
  if (preferred && isEngagementPaymentMethod(preferred)) return preferred;
  if (preferred === "stripe") return "quickbooks";
  if (preferred && isKnownPaymentMethod(preferred)) return "venmo";
  return "venmo";
};

export const paymentProviderForMethod = (method: PaymentMethodId): string => {
  if (method === "stripe") return "stripe";
  if (method === "quickbooks") return "quickbooks";
  return "manual";
};

/** Normalize YYYY-MM-DD or ISO timestamp for invoice paidAt. */
export const normalizePaidAtIso = (paidAt: string): string =>
  paidAt.includes("T") ? paidAt : `${paidAt}T12:00:00.000Z`;

export { invoiceMatchesExpectation } from "@/lib/schedule/expectationInvoiceSync";

export const shouldAutoSendPriorInvoice = (
  priorStatus: ServiceInvoiceStatus | undefined
): boolean =>
  priorStatus === "sent" || priorStatus === "pending_payment";

export interface SyncExpectationInvoiceOptions {
  /** Cancel and create a fresh invoice even when amounts still match. */
  forceReissue?: boolean;
}

const isBillableExpectation = (expectation: ClientPaymentExpectation): boolean =>
  (expectation.kind === "deposit" || expectation.kind === "balance") &&
  expectation.amountCents > 0;

const markExpectationInvoicePaidIfNeeded = async (input: {
  clientId: string;
  serviceId: string;
  invoiceId: string;
  provider: string;
  paidAtIso: string | null;
}): Promise<void> => {
  if (!input.paidAtIso) return;

  const invoice = await readServiceInvoice(
    input.clientId,
    input.serviceId,
    input.invoiceId
  );
  if (!invoice || invoice.status === "paid") return;

  await markServiceInvoicePaid(
    input.clientId,
    input.serviceId,
    input.invoiceId,
    {
      provider: input.provider,
      paidAt: input.paidAtIso,
    }
  );
};

/**
 * Creates or reissues a service invoice for a deposit/balance expectation and
 * marks it paid when the expectation has a paidAt date.
 */
export const syncExpectationToServiceInvoice = async (
  clientId: string,
  serviceId: string,
  engagement: ServiceEngagement,
  expectation: ClientPaymentExpectation,
  dispatchOptions?: ServiceInvoiceDispatchOptions,
  options?: SyncExpectationInvoiceOptions
): Promise<ClientPaymentExpectation> => {
  if (!isBillableExpectation(expectation)) {
    return expectation;
  }

  const description = expectation.kind === "deposit" ? "Deposit" : "Balance";
  const quickbooksIncomeCategory = resolveExpectationQuickBooksIncomeCategory({
    kind: expectation.kind,
    engagementServiceType: engagement.serviceType,
  });
  const paymentMethod = resolveExpectationPaymentMethod(
    engagement.preferredPaymentMethod
  );
  const provider = paymentProviderForMethod(paymentMethod);
  const paidAtIso = expectation.paidAt
    ? normalizePaidAtIso(expectation.paidAt)
    : null;

  let existingInvoice: ServiceInvoice | null = null;
  if (expectation.invoiceId) {
    existingInvoice = await readServiceInvoice(
      clientId,
      serviceId,
      expectation.invoiceId
    );
  }

  if (existingInvoice) {
    if (existingInvoice.status === "paid") {
      if (
        !options?.forceReissue &&
        !invoiceMatchesExpectation(existingInvoice, expectation)
      ) {
        throw new ExpectationBillingError(
          "Cannot reissue a paid invoice from engagement edit. Use a paid correction or a separate adjustment expectation."
        );
      }
      if (!options?.forceReissue) {
        await markExpectationInvoicePaidIfNeeded({
          clientId,
          serviceId,
          invoiceId: existingInvoice.invoiceId,
          provider,
          paidAtIso,
        });
        return expectation;
      }
      throw new ExpectationBillingError(
        "Cannot void and reissue a paid invoice."
      );
    }

    const amountsMatch = invoiceMatchesExpectation(existingInvoice, expectation);
    if (amountsMatch && !options?.forceReissue) {
      await markExpectationInvoicePaidIfNeeded({
        clientId,
        serviceId,
        invoiceId: existingInvoice.invoiceId,
        provider,
        paidAtIso,
      });
      return expectation;
    }

    const priorStatus = existingInvoice.status;
    if (
      existingInvoice.status !== "cancelled" &&
      existingInvoice.status !== "refunded"
    ) {
      await cancelServiceInvoice(
        clientId,
        serviceId,
        existingInvoice.invoiceId
      );
    }

    const invoice = await createServiceInvoice(
      clientId,
      serviceId,
      {
        amountCents: expectation.amountCents,
        paymentMethod,
        description,
        quickbooksIncomeCategory,
        dueDate: expectation.dueDate,
        notes: expectation.notes || `Engagement ${expectation.kind}`,
        send: shouldAutoSendPriorInvoice(priorStatus),
      },
      dispatchOptions
    );

    if (paidAtIso) {
      await markServiceInvoicePaid(clientId, serviceId, invoice.invoiceId, {
        provider,
        paidAt: paidAtIso,
      });
    }

    const now = new Date().toISOString();
    return savePaymentExpectation(clientId, {
      ...expectation,
      invoiceId: invoice.invoiceId,
      updatedAt: now,
    });
  }

  const invoice = await createServiceInvoice(clientId, serviceId, {
    amountCents: expectation.amountCents,
    paymentMethod,
    description,
    quickbooksIncomeCategory,
    dueDate: expectation.dueDate,
    notes: expectation.notes || `Engagement ${expectation.kind}`,
  });

  if (paidAtIso) {
    await markServiceInvoicePaid(clientId, serviceId, invoice.invoiceId, {
      provider,
      paidAt: paidAtIso,
    });
  }

  const now = new Date().toISOString();
  return savePaymentExpectation(clientId, {
    ...expectation,
    invoiceId: invoice.invoiceId,
    updatedAt: now,
  });
};

/** Manual void-and-reissue for a deposit/balance expectation invoice. */
export const reissueExpectationInvoice = async (
  clientId: string,
  serviceId: string,
  engagement: ServiceEngagement,
  expectation: ClientPaymentExpectation,
  dispatchOptions?: ServiceInvoiceDispatchOptions
): Promise<ClientPaymentExpectation> =>
  syncExpectationToServiceInvoice(
    clientId,
    serviceId,
    engagement,
    expectation,
    dispatchOptions,
    { forceReissue: true }
  );

/** @deprecated Use syncExpectationToServiceInvoice */
export const syncDepositExpectationToServiceInvoice = async (
  clientId: string,
  serviceId: string,
  engagement: ServiceEngagement,
  expectation: ClientPaymentExpectation
): Promise<ClientPaymentExpectation> =>
  syncExpectationToServiceInvoice(clientId, serviceId, engagement, expectation);
