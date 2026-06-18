import { describe, expect, it } from "vitest";
import {
  computeServiceBalanceDueCents,
  sumPaidInvoiceCents,
} from "@/lib/client-services/balances";
import type { ServiceInvoice } from "@/types/clientService";

const invoice = (
  overrides: Partial<ServiceInvoice> & Pick<ServiceInvoice, "amountCents" | "status">
): ServiceInvoice => ({
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0001",
  description: "Test",
  dueDate: null,
  paymentMethod: "zelle",
  installmentIndex: null,
  installmentTotal: null,
  quickbooks: null,
  stripe: null,
  sentAt: null,
  paidAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("client service balances", () => {
  it("sums paid invoices only", () => {
    const invoices = [
      invoice({ amountCents: 5000, status: "paid" }),
      invoice({ amountCents: 7425, status: "paid" }),
      invoice({ amountCents: 8000, status: "sent" }),
    ];
    expect(sumPaidInvoiceCents(invoices)).toBe(12425);
  });

  it("computes remaining balance after partial payments", () => {
    const invoices = [
      invoice({ amountCents: 10000, status: "paid" }),
      invoice({ amountCents: 8000, status: "sent" }),
    ];
    expect(computeServiceBalanceDueCents(15425, invoices)).toBe(5425);
  });

  it("accounts for refunds", () => {
    const invoices = [
      invoice({ amountCents: 40000, status: "paid" }),
      invoice({ amountCents: 40000, status: "refunded" }),
    ];
    expect(computeServiceBalanceDueCents(40000, invoices)).toBe(40000);
  });
});
