import { afterEach, describe, expect, it } from "vitest";
import {
  buildInvoiceDownloadUrl,
  createInvoiceAccessToken,
  verifyInvoiceAccessToken,
} from "@/lib/invoices/accessToken";

describe("invoice access token", () => {
  afterEach(() => {
    delete process.env.CLIENT_INVOICE_ACCESS_SECRET;
  });

  it("creates and verifies a signed token", () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const token = createInvoiceAccessToken({
      clientId: "client-1",
      serviceId: "svc-1",
      invoiceId: "inv-1",
      invoiceNumber: "TNP-2026-0001",
      expiresAt,
    });

    expect(verifyInvoiceAccessToken(token)).toEqual({
      clientId: "client-1",
      serviceId: "svc-1",
      invoiceId: "inv-1",
      invoiceNumber: "TNP-2026-0001",
      expiresAt,
    });
  });

  it("rejects expired tokens", () => {
    const token = createInvoiceAccessToken({
      clientId: "client-1",
      serviceId: "svc-1",
      invoiceId: "inv-1",
      invoiceNumber: "TNP-2026-0001",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });

    expect(verifyInvoiceAccessToken(token)).toBeNull();
  });

  it("builds a download URL with origin", () => {
    const { url } = buildInvoiceDownloadUrl({
      clientId: "client-1",
      serviceId: "svc-1",
      invoiceId: "inv-1",
      invoiceNumber: "TNP-2026-0042",
      origin: "https://dev.example.com",
    });

    expect(url).toMatch(/^https:\/\/dev\.example\.com\/invoice\//);
  });
});
