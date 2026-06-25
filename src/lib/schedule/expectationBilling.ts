import { isKnownPaymentMethod } from "@/config/paymentMethods";
import {
  createServiceInvoice,
  markServiceInvoicePaid,
  readServiceInvoice,
} from "@/lib/client-services/storage";
import { savePaymentExpectation } from "@/lib/schedule/expectationStorage";
import type { PaymentMethodId } from "@/types/clientService";
import type {
  ClientPaymentExpectation,
  ServiceEngagement,
} from "@/types/serviceEngagement";

export const resolveExpectationPaymentMethod = (
  preferred: PaymentMethodId | null | undefined
): PaymentMethodId => {
  if (preferred && isKnownPaymentMethod(preferred)) return preferred;
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

/**
 * Creates a service invoice for a deposit expectation and marks it paid when
 * the expectation has a paidAt date. Links expectation.invoiceId for traceability.
 */
export const syncDepositExpectationToServiceInvoice = async (
  clientId: string,
  serviceId: string,
  engagement: ServiceEngagement,
  expectation: ClientPaymentExpectation
): Promise<ClientPaymentExpectation> => {
  if (expectation.kind !== "deposit" || expectation.amountCents <= 0) {
    return expectation;
  }

  const paymentMethod = resolveExpectationPaymentMethod(
    engagement.preferredPaymentMethod
  );
  const provider = paymentProviderForMethod(paymentMethod);
  const paidAtIso = expectation.paidAt
    ? normalizePaidAtIso(expectation.paidAt)
    : null;

  if (expectation.invoiceId) {
    const existingInvoice = await readServiceInvoice(
      clientId,
      serviceId,
      expectation.invoiceId
    );
    if (existingInvoice && paidAtIso && existingInvoice.status !== "paid") {
      await markServiceInvoicePaid(clientId, serviceId, expectation.invoiceId, {
        provider,
        paidAt: paidAtIso,
      });
    }
    return expectation;
  }

  const invoice = await createServiceInvoice(clientId, serviceId, {
    amountCents: expectation.amountCents,
    paymentMethod,
    description: "Deposit",
    dueDate: expectation.dueDate,
    notes: expectation.notes || "Engagement deposit",
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
