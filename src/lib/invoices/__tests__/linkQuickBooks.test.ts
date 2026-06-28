import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceInvoice } from "@/types/clientService";

vi.mock("@/config/quickbooks", () => ({
  isQuickBooksOAuthConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/integrations/quickbooks/invoices", () => ({
  getQuickBooksInvoice: vi.fn(),
  findQuickBooksInvoiceByDocNumber: vi.fn(),
  resolveQuickBooksInvoicePaymentLink: vi.fn(async () => "https://pay.example/qbo"),
}));

vi.mock("@/lib/integrations/quickbooks/salesReceipts", () => ({
  getQuickBooksSalesReceipt: vi.fn(),
  findQuickBooksSalesReceiptByDocNumber: vi.fn(),
}));

import { isQuickBooksOAuthConfigured } from "@/config/quickbooks";
import {
  findQuickBooksInvoiceByDocNumber,
  getQuickBooksInvoice,
} from "@/lib/integrations/quickbooks/invoices";
import { getQuickBooksSalesReceipt } from "@/lib/integrations/quickbooks/salesReceipts";
import { linkServiceInvoiceQuickBooksRef } from "@/lib/invoices/linkQuickBooks";

const baseInvoice = (): ServiceInvoice => ({
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0001",
  subtotalCents: 10000,
  processingFeeCents: 300,
  processingFeePercent: 3,
  amountCents: 10300,
  description: "Birth support",
  dueDate: "2026-06-01",
  paymentMethod: "quickbooks",
  status: "paid",
  installmentIndex: null,
  installmentTotal: null,
  notes: "",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  paymentInstructions: "",
  paymentLink: null,
  quickbooks: null,
  stripe: null,
  documentStorageKey: "doc.html",
  pdfDownloadUrl: null,
  pdfAccessExpiresAt: null,
  lastEmailError: null,
  sentAt: "2026-05-01T00:00:00.000Z",
  paidAt: "2026-05-02T00:00:00.000Z",
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-02T00:00:00.000Z",
});

describe("linkServiceInvoiceQuickBooksRef", () => {
  beforeEach(() => {
    vi.mocked(isQuickBooksOAuthConfigured).mockReturnValue(true);
    vi.clearAllMocks();
  });

  it("links by QuickBooks invoice Id", async () => {
    vi.mocked(getQuickBooksInvoice).mockResolvedValue({
      Id: "145",
      DocNumber: "1042",
      CustomerRef: { value: "9" },
    });

    const ref = await linkServiceInvoiceQuickBooksRef({
      invoice: baseInvoice(),
      link: { invoiceId: "145" },
    });

    expect(ref).toMatchObject({
      invoiceId: "145",
      invoiceNumber: "1042",
      customerId: "9",
      syncStatus: "synced",
      syncedSubtotalCents: 10000,
      syncedAmountCents: 10300,
      paymentLink: "https://pay.example/qbo",
    });
  });

  it("links by QuickBooks invoice document number", async () => {
    vi.mocked(findQuickBooksInvoiceByDocNumber).mockResolvedValue({
      Id: "200",
      DocNumber: "TNP-1042",
      CustomerRef: { value: "12" },
    });

    const ref = await linkServiceInvoiceQuickBooksRef({
      invoice: baseInvoice(),
      link: { invoiceNumber: "TNP-1042" },
    });

    expect(ref?.invoiceId).toBe("200");
    expect(ref?.invoiceNumber).toBe("TNP-1042");
  });

  it("links by QuickBooks sales receipt Id", async () => {
    vi.mocked(getQuickBooksSalesReceipt).mockResolvedValue({
      Id: "88",
      DocNumber: "SR-15",
      CustomerRef: { value: "4" },
    });

    const ref = await linkServiceInvoiceQuickBooksRef({
      invoice: baseInvoice(),
      link: { salesReceiptId: "88" },
    });

    expect(ref).toMatchObject({
      salesReceiptId: "88",
      salesReceiptNumber: "SR-15",
      customerId: "4",
      paymentLink: null,
    });
  });

  it("clears the link when unlink is requested", async () => {
    const ref = await linkServiceInvoiceQuickBooksRef({
      invoice: baseInvoice(),
      link: { unlink: true },
    });

    expect(ref).toBeNull();
    expect(getQuickBooksInvoice).not.toHaveBeenCalled();
  });

  it("requires QuickBooks to be connected", async () => {
    vi.mocked(isQuickBooksOAuthConfigured).mockReturnValue(false);

    await expect(
      linkServiceInvoiceQuickBooksRef({
        invoice: baseInvoice(),
        link: { invoiceId: "145" },
      })
    ).rejects.toThrow(/not connected/i);
  });
});
