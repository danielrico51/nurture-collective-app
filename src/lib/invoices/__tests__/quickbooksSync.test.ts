import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceInvoice } from "@/types/clientService";

describe("service invoice QuickBooks sync helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables sync in direct and hybrid modes", async () => {
    vi.stubEnv("BILLING_SYNC_MODE", "direct");
    const { serviceInvoiceQuickBooksSyncEnabled } = await import(
      "@/lib/invoices/quickbooksSync"
    );
    expect(serviceInvoiceQuickBooksSyncEnabled()).toBe(true);

    vi.stubEnv("BILLING_SYNC_MODE", "hybrid");
    vi.resetModules();
    const hybrid = await import("@/lib/invoices/quickbooksSync");
    expect(hybrid.serviceInvoiceQuickBooksSyncEnabled()).toBe(true);
  });

  it("creates QBO invoices on send for manual payment methods but not stripe", async () => {
    const { shouldCreateQuickBooksInvoiceOnSend } = await import(
      "@/lib/invoices/quickbooksSync"
    );
    const base = { paymentMethod: "venmo" } as ServiceInvoice;

    expect(shouldCreateQuickBooksInvoiceOnSend(base)).toBe(true);
    expect(
      shouldCreateQuickBooksInvoiceOnSend({
        ...base,
        paymentMethod: "zelle",
      })
    ).toBe(true);
    expect(
      shouldCreateQuickBooksInvoiceOnSend({
        ...base,
        paymentMethod: "stripe",
      })
    ).toBe(false);
  });
});
