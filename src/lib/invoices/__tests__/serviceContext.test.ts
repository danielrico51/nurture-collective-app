import { describe, expect, it } from "vitest";
import {
  buildInvoiceServiceContext,
  formatClientInvoiceStatusLabel,
  resolveInvoicePaymentTypeLabel,
} from "@/lib/invoices/serviceContext";
import type { ClientService, ServiceInvoice } from "@/types/clientService";

const service: ClientService = {
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
};

const invoice = (
  overrides: Partial<ServiceInvoice> & Pick<ServiceInvoice, "invoiceId" | "amountCents" | "status">
): ServiceInvoice => ({
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0001",
  description: "Deposit",
  dueDate: null,
  paymentMethod: "zelle",
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
  sentAt: null,
  paidAt: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  ...overrides,
});

describe("invoice service context", () => {
  it("labels sent invoices as Unpaid for clients", () => {
    expect(formatClientInvoiceStatusLabel("sent")).toBe("Unpaid");
    expect(formatClientInvoiceStatusLabel("pending_payment")).toBe("Unpaid");
    expect(formatClientInvoiceStatusLabel("paid")).toBe("Paid");
  });

  it("detects installment vs full payment", () => {
    expect(
      resolveInvoicePaymentTypeLabel(
        invoice({ invoiceId: "1", amountCents: 50000, status: "sent", installmentIndex: 2, installmentTotal: 3 }),
        service,
        100000
      )
    ).toBe("Installment 2 of 3");

    expect(
      resolveInvoicePaymentTypeLabel(
        invoice({ invoiceId: "1", amountCents: 150000, status: "sent" }),
        service,
        0
      )
    ).toBe("Full service payment");
  });

  it("builds payment history for the service", () => {
    const invoices = [
      invoice({ invoiceId: "a", amountCents: 50000, status: "paid", paidAt: "2026-02-01T00:00:00.000Z", invoiceNumber: "TNP-2026-0001" }),
      invoice({ invoiceId: "b", amountCents: 100000, status: "sent", invoiceNumber: "TNP-2026-0002" }),
    ];
    const context = buildInvoiceServiceContext(
      service,
      invoices,
      invoices[1]
    );
    expect(context.paidCents).toBe(50000);
    expect(context.balanceDueCents).toBe(100000);
    expect(context.paymentHistory).toHaveLength(2);
    expect(context.paymentHistory[1].isCurrent).toBe(true);
    expect(context.paymentStatusLabel).toBe("Unpaid");
  });
});
