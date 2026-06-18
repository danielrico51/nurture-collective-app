import { describe, expect, it } from "vitest";
import {
  mapServiceInvoicePaymentStatus,
  serviceInvoiceToMemberPurchase,
} from "@/lib/purchases/memberClientInvoices";
import type { ClientServiceWithInvoices, ServiceInvoice } from "@/types/clientService";

const service: ClientServiceWithInvoices = {
  serviceId: "svc-1",
  clientId: "client-1",
  title: "Postpartum doula care",
  providerName: "Alex",
  serviceDate: "2026-02-01",
  totalFeeCents: 150000,
  feeItems: [],
  proposalId: null,
  googleDocUrl: null,
  status: "active",
  notes: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  invoices: [],
  paidCents: 50000,
  balanceDueCents: 100000,
};

const invoice = (
  overrides: Partial<ServiceInvoice> = {}
): ServiceInvoice => ({
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0042",
  subtotalCents: 50000,
  processingFeeCents: 1500,
  processingFeePercent: 3,
  amountCents: 51500,
  description: "Installment 1 of 3",
  dueDate: "2026-03-01",
  paymentMethod: "venmo",
  status: "sent",
  installmentIndex: 1,
  installmentTotal: 3,
  notes: "",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  paymentInstructions: "",
  paymentLink: null,
  quickbooks: null,
  stripe: null,
  documentStorageKey: null,
  pdfDownloadUrl: "https://www.nesting-place.com/invoice/test-token",
  pdfAccessExpiresAt: "2027-01-01T00:00:00.000Z",
  lastEmailError: null,
  sentAt: "2026-02-15T00:00:00.000Z",
  paidAt: null,
  createdAt: "2026-02-15T00:00:00.000Z",
  updatedAt: "2026-02-15T00:00:00.000Z",
  ...overrides,
});

describe("memberClientInvoices", () => {
  it("maps invoice payment statuses for member UI", () => {
    expect(mapServiceInvoicePaymentStatus("paid")).toBe("paid");
    expect(mapServiceInvoicePaymentStatus("sent")).toBe("invoice_sent");
    expect(mapServiceInvoicePaymentStatus("pending_payment")).toBe(
      "pending_payment"
    );
  });

  it("maps CRM service invoices to member purchases with print URL", () => {
    const purchase = serviceInvoiceToMemberPurchase(
      service,
      invoice(),
      "client-1"
    );

    expect(purchase.kind).toBe("client_invoice");
    expect(purchase.title).toBe("Postpartum doula care");
    expect(purchase.invoiceNumber).toBe("TNP-2026-0042");
    expect(purchase.printUrl).toBe(
      "https://www.nesting-place.com/invoice/test-token"
    );
    expect(purchase.installmentLabel).toBe("Installment 1 of 3");
    expect(purchase.amountCents).toBe(51500);
    expect(purchase.paymentStatus).toBe("invoice_sent");
  });

  it("builds a fresh print URL when stored link expired", () => {
    const purchase = serviceInvoiceToMemberPurchase(
      service,
      invoice({
        pdfDownloadUrl: "https://www.nesting-place.com/invoice/old",
        pdfAccessExpiresAt: "2020-01-01T00:00:00.000Z",
      }),
      "client-1"
    );

    expect(purchase.printUrl).toContain("/invoice/");
    expect(purchase.printUrl).not.toBe(
      "https://www.nesting-place.com/invoice/old"
    );
  });
});
