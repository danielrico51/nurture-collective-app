import { describe, expect, it } from "vitest";
import {
  buildAchInvoiceInstructions,
  buildVenmoInvoiceInstructions,
  buildZelleInvoiceInstructions,
} from "@/lib/invoices/paymentInstructions";
import type { ClientRecord } from "@/types/client";
import type { ServiceInvoice } from "@/types/clientService";

const client: ClientRecord = {
  clientId: "client-1",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  status: "active",
  leadId: null,
  cognitoSub: null,
  source: "manual_test",
  coordinatorId: "",
  coordinatorEmail: "",
  tags: [],
  locationZip: null,
  homeAddress: null,
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

const invoice: ServiceInvoice = {
  invoiceId: "inv-1",
  serviceId: "svc-1",
  clientId: "client-1",
  invoiceNumber: "TNP-2026-0042",
  subtotalCents: 7425,
  processingFeeCents: 0,
  processingFeePercent: null,
  amountCents: 7425,
  description: "Postpartum care",
  dueDate: "2026-03-01",
  paymentMethod: "venmo",
  status: "draft",
  installmentIndex: null,
  installmentTotal: null,
  notes: "",
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

describe("paymentInstructions", () => {
  it("uses @thenestingplace for Venmo and Zelle", () => {
    expect(buildVenmoInvoiceInstructions(invoice, client)).toContain(
      "@thenestingplace"
    );
    expect(buildVenmoInvoiceInstructions(invoice, client)).toContain(
      "https://www.venmo.com/u/thenestingplace"
    );
    expect(buildZelleInvoiceInstructions(
      { ...invoice, paymentMethod: "zelle" },
      client
    )).toContain("@thenestingplace");
  });

  it("includes Chase ACH details from the payment sheet", () => {
    const text = buildAchInvoiceInstructions(
      { ...invoice, paymentMethod: "ach" },
      client
    );
    expect(text).toContain("Chase Bank");
    expect(text).toContain("021202337");
    expect(text).toContain("2910010335");
    expect(text).toContain("Nurture Collective LLC");
    expect(text).toContain("Jane Doe — TNP-2026-0042");
  });
});
