import { describe, expect, it, vi } from "vitest";
import type { ClientService, ServiceInvoice } from "@/types/clientService";

vi.mock("@/config/quickbooks", () => ({
  serverQuickBooksConfig: {
    defaultItemId: "fallback-item",
    itemIds: {
      birth_services: "birth-item",
      postpartum_support: "postpartum-item",
      other_operation_income: "other-item",
      deposit: "deposit-item",
    },
  },
}));

import {
  classifyServiceInvoiceIncomeCategory,
  resolveQuickBooksItemIdForCategory,
  resolveServiceInvoiceQuickBooksItemId,
} from "@/lib/invoices/quickbooksIncomeRouting";

const baseService = (overrides: Partial<ClientService> = {}): ClientService => ({
  serviceId: "svc-1",
  clientId: "client-1",
  title: "Postpartum doula 2026",
  providerName: "Alex",
  serviceDate: "2026-01-15",
  totalFeeCents: 100_000,
  feeItems: [],
  proposalId: null,
  googleDocUrl: null,
  status: "active",
  notes: "",
  engagementId: "eng-1",
  providerId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const baseInvoice = (overrides: Partial<ServiceInvoice> = {}): ServiceInvoice => ({
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0001",
  subtotalCents: 50_000,
  processingFeeCents: 0,
  processingFeePercent: null,
  amountCents: 50_000,
  description: "Balance",
  quickbooksIncomeCategory: null,
  dueDate: "2026-03-01",
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

describe("classifyServiceInvoiceIncomeCategory", () => {
  it("routes deposit invoices to the deposit category", () => {
    expect(
      classifyServiceInvoiceIncomeCategory({
        invoice: baseInvoice({ description: "Deposit" }),
        service: baseService({ title: "Postpartum doula 2026" }),
        engagementServiceType: "postpartum",
      })
    ).toBe("deposit");

    expect(
      classifyServiceInvoiceIncomeCategory({
        invoice: baseInvoice({ description: "Initial deposit" }),
        service: baseService(),
        engagementServiceType: "postpartum",
      })
    ).toBe("deposit");
  });

  it("routes birth engagement balances to birth services", () => {
    expect(
      classifyServiceInvoiceIncomeCategory({
        invoice: baseInvoice({ description: "Balance" }),
        service: baseService({ title: "Birth doula 2026" }),
        engagementServiceType: "birth",
      })
    ).toBe("birth_services");
  });

  it("routes postpartum engagement balances to postpartum support", () => {
    expect(
      classifyServiceInvoiceIncomeCategory({
        invoice: baseInvoice({ description: "Balance" }),
        service: baseService(),
        engagementServiceType: "postpartum",
      })
    ).toBe("postpartum_support");
  });

  it("routes classes and massages to other operation income", () => {
    expect(
      classifyServiceInvoiceIncomeCategory({
        invoice: baseInvoice({ description: "Registration fee" }),
        service: baseService({ title: "CPR class 2/7", engagementId: null }),
      })
    ).toBe("other_operation_income");

    expect(
      classifyServiceInvoiceIncomeCategory({
        invoice: baseInvoice({ description: "Session" }),
        service: baseService({
          title: "Prenatal massage",
          engagementId: null,
        }),
      })
    ).toBe("other_operation_income");
  });
});

describe("resolveQuickBooksItemIdForCategory", () => {
  it("maps categories to configured item ids with fallback", () => {
    expect(resolveQuickBooksItemIdForCategory("deposit")).toBe("deposit-item");
    expect(resolveQuickBooksItemIdForCategory("birth_services")).toBe("birth-item");
    expect(resolveQuickBooksItemIdForCategory("postpartum_support")).toBe(
      "postpartum-item"
    );
    expect(resolveQuickBooksItemIdForCategory("other_operation_income")).toBe(
      "other-item"
    );
  });
});

describe("resolveQuickBooksItemIdForCategory without deposit item", () => {
  it("does not fall back to the generic Services item for deposits", async () => {
    vi.resetModules();
    vi.doMock("@/config/quickbooks", () => ({
      serverQuickBooksConfig: {
        defaultItemId: "fallback-item",
        itemIds: {
          birth_services: "",
          postpartum_support: "postpartum-item",
          other_operation_income: "",
          deposit: "",
        },
      },
    }));
    const { resolveQuickBooksItemIdForCategory: resolve } = await import(
      "@/lib/invoices/quickbooksIncomeRouting"
    );
    expect(resolve("deposit")).toBe("");
    expect(resolve("postpartum_support")).toBe("postpartum-item");
  });
});

describe("resolveServiceInvoiceQuickBooksItemId", () => {
  it("returns the item id for the classified category", () => {
    expect(
      resolveServiceInvoiceQuickBooksItemId({
        invoice: baseInvoice({ description: "Deposit" }),
        service: baseService(),
        engagementServiceType: "postpartum",
      })
    ).toBe("deposit-item");
  });

  it("uses an explicit income category when set on the invoice", () => {
    expect(
      resolveServiceInvoiceQuickBooksItemId({
        invoice: baseInvoice({
          description: "Balance",
          quickbooksIncomeCategory: "other_operation_income",
        }),
        service: baseService({ title: "Postpartum doula 2026" }),
        engagementServiceType: "postpartum",
      })
    ).toBe("other-item");
  });
});
