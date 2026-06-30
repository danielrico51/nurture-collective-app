import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceInvoice } from "@/types/clientService";
import type {
  ClientPaymentExpectation,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const {
  cancelServiceInvoice,
  createServiceInvoice,
  markServiceInvoicePaid,
  readServiceInvoice,
} = vi.hoisted(() => ({
  cancelServiceInvoice: vi.fn(),
  createServiceInvoice: vi.fn(),
  markServiceInvoicePaid: vi.fn(),
  readServiceInvoice: vi.fn(),
}));

const { savePaymentExpectation } = vi.hoisted(() => ({
  savePaymentExpectation: vi.fn(async (_clientId: string, expectation: ClientPaymentExpectation) =>
    expectation
  ),
}));

vi.mock("@/lib/client-services/storage", () => ({
  cancelServiceInvoice,
  createServiceInvoice,
  markServiceInvoicePaid,
  readServiceInvoice,
}));

vi.mock("@/lib/schedule/expectationStorage", () => ({
  savePaymentExpectation,
}));

import {
  ExpectationBillingError,
  syncExpectationToServiceInvoice,
} from "@/lib/schedule/expectationBilling";

const clientId = "client-1";
const serviceId = "service-1";

const engagement: ServiceEngagement = {
  engagementId: "eng-1",
  clientId,
  serviceId,
  serviceType: "postpartum",
  scheduleYear: 2026,
  primaryProviderId: null,
  bookDate: "2026-01-15",
  estimatedDate: null,
  estimatedNotes: "",
  status: "booked",
  preferredPaymentMethod: "quickbooks",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const baseExpectation: ClientPaymentExpectation = {
  expectationId: "exp-deposit",
  engagementId: engagement.engagementId,
  packageId: "pkg-1",
  kind: "deposit",
  amountCents: 50_000,
  dueDate: "2026-02-01",
  dueLabel: "",
  paidAt: null,
  invoiceId: "inv-old",
  coverageProviderId: null,
  notes: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const existingSentInvoice = (): ServiceInvoice => ({
  invoiceId: "inv-old",
  serviceId,
  clientId,
  invoiceNumber: "TNP-2026-0001",
  subtotalCents: 50_000,
  processingFeeCents: 0,
  processingFeePercent: null,
  amountCents: 50_000,
  description: "Deposit",
  dueDate: "2026-02-01",
  paymentMethod: "quickbooks",
  status: "sent",
  installmentIndex: null,
  installmentTotal: null,
  notes: "",
  customerName: "Test Client",
  customerEmail: "client@example.com",
  paymentInstructions: "",
  paymentLink: null,
  quickbooks: null,
  stripe: null,
  documentStorageKey: null,
  pdfDownloadUrl: null,
  pdfAccessExpiresAt: null,
  lastEmailError: null,
  sentAt: "2026-01-10T00:00:00.000Z",
  paidAt: null,
  createdAt: "2026-01-05T00:00:00.000Z",
  updatedAt: "2026-01-10T00:00:00.000Z",
});

describe("syncExpectationToServiceInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when linked invoice already matches the expectation", async () => {
    readServiceInvoice.mockResolvedValue(existingSentInvoice());

    const result = await syncExpectationToServiceInvoice(
      clientId,
      serviceId,
      engagement,
      baseExpectation
    );

    expect(result).toEqual(baseExpectation);
    expect(cancelServiceInvoice).not.toHaveBeenCalled();
    expect(createServiceInvoice).not.toHaveBeenCalled();
  });

  it("voids, cancels, and reissues when the expectation amount changes", async () => {
    readServiceInvoice.mockResolvedValue(existingSentInvoice());
    cancelServiceInvoice.mockResolvedValue({
      ...existingSentInvoice(),
      status: "cancelled",
    });
    createServiceInvoice.mockResolvedValue({
      ...existingSentInvoice(),
      invoiceId: "inv-new",
      invoiceNumber: "TNP-2026-0002",
      subtotalCents: 60_000,
      amountCents: 60_000,
      status: "draft",
    });

    const updatedExpectation = {
      ...baseExpectation,
      amountCents: 60_000,
    };

    const result = await syncExpectationToServiceInvoice(
      clientId,
      serviceId,
      engagement,
      updatedExpectation,
      { actor: { sub: "user-1", email: "staff@example.com" }, origin: "https://app.test" }
    );

    expect(cancelServiceInvoice).toHaveBeenCalledWith(
      clientId,
      serviceId,
      "inv-old"
    );
    expect(createServiceInvoice).toHaveBeenCalledWith(
      clientId,
      serviceId,
      expect.objectContaining({
        amountCents: 60_000,
        send: true,
      }),
      expect.objectContaining({ origin: "https://app.test" })
    );
    expect(savePaymentExpectation).toHaveBeenCalledWith(
      clientId,
      expect.objectContaining({ invoiceId: "inv-new", amountCents: 60_000 })
    );
    expect(result.invoiceId).toBe("inv-new");
  });

  it("blocks reissue when the linked invoice is already paid", async () => {
    readServiceInvoice.mockResolvedValue({
      ...existingSentInvoice(),
      status: "paid",
      paidAt: "2026-01-20T00:00:00.000Z",
    });

    await expect(
      syncExpectationToServiceInvoice(clientId, serviceId, engagement, {
        ...baseExpectation,
        amountCents: 60_000,
      })
    ).rejects.toThrow(ExpectationBillingError);

    expect(cancelServiceInvoice).not.toHaveBeenCalled();
    expect(createServiceInvoice).not.toHaveBeenCalled();
  });
});

describe("expectationBilling helpers", () => {
  it("defaults missing payment method to venmo", async () => {
    const { resolveExpectationPaymentMethod } = await import(
      "@/lib/schedule/expectationBilling"
    );
    expect(resolveExpectationPaymentMethod(null)).toBe("venmo");
    expect(resolveExpectationPaymentMethod(undefined)).toBe("venmo");
    expect(resolveExpectationPaymentMethod("")).toBe("venmo");
  });

  it("keeps engagement payment methods", async () => {
    const { resolveExpectationPaymentMethod } = await import(
      "@/lib/schedule/expectationBilling"
    );
    expect(resolveExpectationPaymentMethod("zelle")).toBe("zelle");
    expect(resolveExpectationPaymentMethod("quickbooks")).toBe("quickbooks");
  });

  it("maps legacy stripe engagements to quickbooks for invoicing", async () => {
    const { resolveExpectationPaymentMethod } = await import(
      "@/lib/schedule/expectationBilling"
    );
    expect(resolveExpectationPaymentMethod("stripe")).toBe("quickbooks");
  });

  it("maps payment methods to invoice payment providers", async () => {
    const { paymentProviderForMethod } = await import(
      "@/lib/schedule/expectationBilling"
    );
    expect(paymentProviderForMethod("stripe")).toBe("stripe");
    expect(paymentProviderForMethod("quickbooks")).toBe("quickbooks");
    expect(paymentProviderForMethod("venmo")).toBe("manual");
    expect(paymentProviderForMethod("zelle")).toBe("manual");
  });

  it("normalizes date-only paidAt values to ISO", async () => {
    const { normalizePaidAtIso } = await import(
      "@/lib/schedule/expectationBilling"
    );
    expect(normalizePaidAtIso("2026-03-15")).toBe("2026-03-15T12:00:00.000Z");
    expect(normalizePaidAtIso("2026-03-15T08:00:00.000Z")).toBe(
      "2026-03-15T08:00:00.000Z"
    );
  });
});
