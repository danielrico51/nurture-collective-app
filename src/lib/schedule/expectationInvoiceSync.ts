import type { ServiceInvoice } from "@/types/clientService";
import type { ClientPaymentExpectation } from "@/types/serviceEngagement";

export const invoiceMatchesExpectation = (
  invoice: ServiceInvoice,
  expectation: ClientPaymentExpectation
): boolean =>
  invoice.subtotalCents === expectation.amountCents &&
  invoice.dueDate === expectation.dueDate;

export const isExpectationInvoiceOutOfSync = (
  invoice: ServiceInvoice | null | undefined,
  expectation: ClientPaymentExpectation
): boolean =>
  Boolean(invoice) && !invoiceMatchesExpectation(invoice!, expectation);
