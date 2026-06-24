import { describe, expect, it } from "vitest";
import {
  buildServiceInvoiceQuickBooksLineItems,
  resolveQuickBooksInvoiceAmounts,
} from "@/lib/invoices/quickbooksInvoiceAmounts";
import type { ServiceInvoice } from "@/types/clientService";

const baseInvoice = (
  overrides: Partial<ServiceInvoice> = {}
): ServiceInvoice => ({
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0001",
  subtotalCents: 100000,
  processingFeeCents: 3000,
  processingFeePercent: 3,
  amountCents: 103000,
  description: "Remaining balance",
  dueDate: null,
  paymentMethod: "quickbooks",
  status: "sent",
  installmentIndex: null,
  installmentTotal: null,
  notes: "",
  customerName: "Jane",
  customerEmail: "jane@example.com",
  paymentInstructions: "",
  paymentLink: null,
  quickbooks: null,
  stripe: null,
  documentStorageKey: null,
  pdfDownloadUrl: null,
  pdfAccessExpiresAt: null,
  lastEmailError: null,
  sentAt: "2026-02-01T00:00:00.000Z",
  paidAt: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  ...overrides,
});

describe("resolveQuickBooksInvoiceAmounts", () => {
  it("syncs subtotal only and excludes CRM processing fees", () => {
    const amounts = resolveQuickBooksInvoiceAmounts(
      baseInvoice({
        subtotalCents: 50000,
        processingFeeCents: 4500,
        processingFeePercent: 3,
        amountCents: 54500,
      })
    );

    expect(amounts).toEqual({
      subtotalCents: 50000,
      processingFeeCents: 0,
      processingFeePercent: null,
      amountCents: 50000,
    });
  });
});

describe("buildServiceInvoiceQuickBooksLineItems", () => {
  it("builds a single service line without a processing fee line item", () => {
    const lineItems = buildServiceInvoiceQuickBooksLineItems({
      invoice: baseInvoice({
        subtotalCents: 50000,
        processingFeeCents: 4500,
        processingFeePercent: 3,
        amountCents: 54500,
      }),
      serviceTitle: "Postpartum doula care",
    });

    expect(lineItems).toEqual([
      {
        amount: 500,
        description: "Remaining balance",
        quantity: 1,
        unitPrice: 500,
      },
    ]);
  });
});
