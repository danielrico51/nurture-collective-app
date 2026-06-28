import { describe, expect, it } from "vitest";
import {
  buildInvoiceEmailSubject,
  buildInvoiceEmailHtml,
  buildInvoiceHtmlDocument,
  buildInvoicePlainText,
} from "@/lib/invoices/buildDocument";
import { buildInvoiceServiceContext } from "@/lib/invoices/serviceContext";
import type { ClientRecord } from "@/types/client";
import type { ClientService, ServiceInvoice } from "@/types/clientService";

const docInput = (
  overrides: Partial<Parameters<typeof buildInvoicePlainText>[0]> = {}
) => {
  const inv = overrides.invoice ?? invoice;
  return {
    invoice: inv,
    service,
    client,
    paymentLink: null,
    paymentInstructions: "Pay via Zelle",
    serviceContext: buildInvoiceServiceContext(service, [inv], inv),
    ...overrides,
  };
};

const client: ClientRecord = {
  clientId: "client-1",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  status: "active",
  leadId: null,
  cognitoSub: null,
  source: "manual_test",
  coordinatorId: "coord-1",
  coordinatorEmail: "coord@example.com",
  tags: [],
  locationZip: null,
  notesSummary: "",
  billing: {
    lifetimeValueCents: 0,
    openInvoiceCount: 0,
    lastInvoiceAt: null,
  },
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const service: ClientService = {
  serviceId: "svc-1",
  clientId: "client-1",
  title: "Postpartum doula care",
  providerName: "Alex Smith",
  serviceDate: "2026-02-01",
  totalFeeCents: 150000,
  feeItems: [],
  proposalId: null,
  googleDocUrl: null,
  status: "active",
  notes: "",
  engagementId: null,
  providerId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const invoice: ServiceInvoice = {
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0042",
  subtotalCents: 7425,
  processingFeeCents: 0,
  processingFeePercent: null,
  amountCents: 7425,
  description: "Installment 1 of 2",
  dueDate: "2026-03-01",
  paymentMethod: "stripe",
  status: "draft",
  installmentIndex: 1,
  installmentTotal: 2,
  notes: "Submit to insurance under lactation support (CPT 99404).",
  customerName: "Jane Doe",
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
  createdAt: "2026-02-15T00:00:00.000Z",
  updatedAt: "2026-02-15T00:00:00.000Z",
};

describe("buildInvoiceDocument", () => {
  it("builds email subject with invoice number", () => {
    expect(buildInvoiceEmailSubject("TNP-2026-0042")).toContain("TNP-2026-0042");
  });

  it("includes payment link in plain text when provided", () => {
    const text = buildInvoicePlainText(
      docInput({
        paymentLink: "https://checkout.stripe.com/pay/cs_test_123",
        paymentInstructions: "Pay online",
      })
    );
    expect(text).toContain("TNP-2026-0042");
    expect(text).toContain("Jane Doe");
    expect(text).toContain("https://checkout.stripe.com/pay/cs_test_123");
    expect(text).toContain("$74.25");
  });

  it("includes Zelle instructions when no payment link", () => {
    const instructions =
      "Pay $74.25 via Zelle to @thenestingplace.\nMemo: Jane Doe — TNP-2026-0042\nScan the Zelle QR code";
    const text = buildInvoicePlainText(
      docInput({
        invoice: { ...invoice, paymentMethod: "zelle" },
        paymentInstructions: instructions,
      })
    );
    expect(text).toContain(instructions);
    expect(text).not.toContain("Pay online:");
  });

  it("includes invoice notes in plain text and email HTML", () => {
    const text = buildInvoicePlainText(docInput());
    expect(text).toContain("Notes");
    expect(text).toContain("Submit to insurance under lactation support");

    const html = buildInvoiceEmailHtml(docInput());
    expect(html).toContain("Submit to insurance under lactation support");
  });

  it("omits notes section when empty", () => {
    const text = buildInvoicePlainText(
      docInput({ invoice: { ...invoice, notes: "" } })
    );
    expect(text).not.toContain("Notes\n");
  });

  it("includes no-attachment note in plain text", () => {
    const text = buildInvoicePlainText(docInput());
    expect(text).toContain("Hi Jane");
    expect(text).toContain("No PDF attachment");
  });

  it("includes PDF download link in email and plain text", () => {
    const pdfUrl = "https://www.nesting-place.com/invoice/test-token";
    const text = buildInvoicePlainText(docInput({ pdfDownloadUrl: pdfUrl }));
    expect(text).toContain("Save a PDF for insurance");
    expect(text).toContain(pdfUrl);

    const html = buildInvoiceEmailHtml(docInput({ pdfDownloadUrl: pdfUrl }));
    expect(html).toContain("Download PDF for insurance");
    expect(html).toContain(pdfUrl);
  });

  it("renders email-safe HTML with greeting and pay button", () => {
    const html = buildInvoiceEmailHtml(
      docInput({
        paymentLink: "https://checkout.stripe.com/pay/cs_test_123",
        paymentInstructions: "Pay online",
      })
    );
    expect(html).toContain("nesting-place-invoice-logo.png");
    expect(html).toContain("Hi Jane");
    expect(html).toContain("no attachment required");
    expect(html).toContain("TNP-2026-0042");
    expect(html).toContain("Pay $74.25 online");
    expect(html).toContain('role="presentation"');
  });

  it("renders printable HTML document for admin preview", () => {
    const html = buildInvoiceHtmlDocument(
      docInput({
        paymentLink: "https://checkout.stripe.com/pay/cs_test_123",
        paymentInstructions: "Pay online",
      })
    );
    expect(html).toContain("nesting-place-invoice-logo.png");
    expect(html).toContain("TNP-2026-0042");
    expect(html).toContain("Pay $74.25 online");
    expect(html).toContain("Installment 1 of 2");
    expect(html).toContain("Alex Smith");
  });

  it("includes Venmo QR code and handle in email HTML", () => {
    const html = buildInvoiceEmailHtml(
      docInput({
        invoice: { ...invoice, paymentMethod: "venmo" },
        paymentLink: "https://account.venmo.com/pay?txn=pay&recipients=thenestingplace",
        paymentInstructions: "Pay via Venmo",
      })
    );
    expect(html).toContain("@thenestingplace");
    expect(html).toContain("https://www.venmo.com/u/thenestingplace");
    expect(html).toContain("/branding/payments/venmo-qr.jpg");
    expect(html).toContain("info@nesting-place.com");
  });

  it("renders processing fee line when present", () => {
    const html = buildInvoiceHtmlDocument(
      docInput({
        invoice: {
          ...invoice,
          subtotalCents: 10000,
          processingFeeCents: 300,
          processingFeePercent: 3,
          amountCents: 10300,
        },
      })
    );
    expect(html).toContain("Processing fee (3%)");
    expect(html).toContain("$100.00");
    expect(html).toContain("$3.00");
    expect(html).toContain("$103.00");
  });
});
