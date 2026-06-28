import { describe, expect, it } from "vitest";
import {
  normalizeStoredInvoiceAmounts,
  resolveSyncedInvoiceAmountFields,
} from "@/lib/invoices/processingFee";

describe("invoice field sync", () => {
  it("keeps subtotal, fee, and total consistent after removing a fee", () => {
    const synced = resolveSyncedInvoiceAmountFields({
      amountCents: 1120000,
      applyProcessingFee: false,
      paymentMethod: "quickbooks",
      existing: {
        subtotalCents: 1120000,
        processingFeeCents: 33600,
        processingFeePercent: 3,
        amountCents: 1153600,
        paymentMethod: "quickbooks",
      },
    });

    expect(synced).toEqual({
      subtotalCents: 1153600,
      processingFeeCents: 0,
      processingFeePercent: null,
      amountCents: 1153600,
    });
    expect(normalizeStoredInvoiceAmounts(synced)).toEqual(synced);
  });

  it("keeps subtotal, fee, and total consistent after changing fee percent", () => {
    const synced = resolveSyncedInvoiceAmountFields({
      amountCents: 1000000,
      applyProcessingFee: true,
      processingFeePercent: 2.5,
      paymentMethod: "venmo",
    });

    expect(synced).toEqual({
      subtotalCents: 1000000,
      processingFeeCents: 25000,
      processingFeePercent: 2.5,
      amountCents: 1025000,
    });
    expect(normalizeStoredInvoiceAmounts(synced)).toEqual(synced);
  });

  it("keeps subtotal, fee, and total consistent after changing subtotal with fee on", () => {
    const synced = resolveSyncedInvoiceAmountFields({
      amountCents: 1153600,
      applyProcessingFee: true,
      processingFeePercent: 3,
      paymentMethod: "quickbooks",
      existing: {
        subtotalCents: 1120000,
        processingFeeCents: 33600,
        processingFeePercent: 3,
        amountCents: 1153600,
        paymentMethod: "quickbooks",
      },
    });

    expect(synced.subtotalCents).toBe(1153600);
    expect(synced.processingFeeCents).toBe(34608);
    expect(synced.amountCents).toBe(1188208);
    expect(normalizeStoredInvoiceAmounts(synced)).toEqual(synced);
  });
});
