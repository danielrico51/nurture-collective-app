import { describe, expect, it } from "vitest";
import { formatServiceInvoiceQuickBooksLabel } from "@/lib/invoices/quickbooksLabels";

describe("formatServiceInvoiceQuickBooksLabel", () => {
  it("prefers sales receipt numbers for Stripe-paid invoices", () => {
    expect(
      formatServiceInvoiceQuickBooksLabel({
        salesReceiptId: "55",
        salesReceiptNumber: "1042",
        syncStatus: "synced",
      })
    ).toBe("Sales receipt #1042");
  });

  it("shows QBO invoice numbers for QuickBooks pay-link invoices", () => {
    expect(
      formatServiceInvoiceQuickBooksLabel({
        invoiceId: "901",
        invoiceNumber: "TNP-2026-0042",
        syncStatus: "synced",
      })
    ).toBe("Invoice #TNP-2026-0042");
  });
});
