import { describe, expect, it } from "vitest";
import {
  ClientServiceValidationError,
  validateServiceCanBeCancelled,
} from "@/lib/client-services/storage";
import type { ServiceInvoice } from "@/types/clientService";

const baseInvoice = (
  overrides: Partial<ServiceInvoice> = {}
): ServiceInvoice => ({
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0001",
  subtotalCents: 10000,
  processingFeeCents: 0,
  processingFeePercent: null,
  amountCents: 10000,
  description: "Deposit",
  quickbooksIncomeCategory: null,
  dueDate: null,
  paymentMethod: "quickbooks",
  status: "draft",
  installmentIndex: null,
  installmentTotal: null,
  notes: "",
  sentAt: null,
  paidAt: null,
  refundedAt: null,
  cancelledAt: null,
  pdfDownloadUrl: null,
  quickbooks: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("validateServiceCanBeCancelled", () => {
  it("allows cancellation when all invoices are closed", () => {
    expect(() =>
      validateServiceCanBeCancelled([
        baseInvoice({ status: "paid" }),
        baseInvoice({ invoiceId: "inv-2", status: "cancelled" }),
      ])
    ).not.toThrow();
  });

  it("blocks cancellation when draft, sent, or pending invoices remain", () => {
    for (const status of ["draft", "sent", "pending_payment"] as const) {
      expect(() =>
        validateServiceCanBeCancelled([baseInvoice({ status })])
      ).toThrow(ClientServiceValidationError);
    }
  });

  it("reports how many open invoices must be voided first", () => {
    try {
      validateServiceCanBeCancelled([
        baseInvoice({ invoiceId: "inv-1", status: "sent" }),
        baseInvoice({ invoiceId: "inv-2", status: "draft" }),
      ]);
      expect.fail("expected validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(ClientServiceValidationError);
      expect((error as ClientServiceValidationError).message).toContain(
        "2 open invoices"
      );
    }
  });
});
