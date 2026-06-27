import { describe, expect, it } from "vitest";
import {
  computeProcessingFeeCents,
  DEFAULT_PROCESSING_FEE_PERCENT,
  normalizeStoredInvoiceAmounts,
  paymentMethodSupportsProcessingFee,
  resolveInvoiceAmountFieldsFromInput,
  resolveInvoiceAmounts,
} from "@/lib/invoices/processingFee";

describe("processingFee", () => {
  it("identifies card-style payment methods", () => {
    expect(paymentMethodSupportsProcessingFee("venmo")).toBe(true);
    expect(paymentMethodSupportsProcessingFee("stripe")).toBe(true);
    expect(paymentMethodSupportsProcessingFee("quickbooks")).toBe(true);
    expect(paymentMethodSupportsProcessingFee("zelle")).toBe(false);
  });

  it("computes default 3% fee on subtotal", () => {
    expect(computeProcessingFeeCents(10000, DEFAULT_PROCESSING_FEE_PERCENT)).toBe(
      300
    );
    const amounts = resolveInvoiceAmounts({
      subtotalCents: 10000,
      applyProcessingFee: true,
    });
    expect(amounts).toEqual({
      subtotalCents: 10000,
      processingFeeCents: 300,
      processingFeePercent: 3,
      amountCents: 10300,
    });
  });

  it("allows custom fee percent", () => {
    const amounts = resolveInvoiceAmounts({
      subtotalCents: 5000,
      applyProcessingFee: true,
      processingFeePercent: 2.5,
    });
    expect(amounts.processingFeeCents).toBe(125);
    expect(amounts.amountCents).toBe(5125);
  });

  it("normalizes legacy invoices without fee fields", () => {
    expect(
      normalizeStoredInvoiceAmounts({ amountCents: 7425 })
    ).toEqual({
      subtotalCents: 7425,
      processingFeeCents: 0,
      processingFeePercent: null,
      amountCents: 7425,
    });
  });

  it("resolves create input with fee for venmo", () => {
    const amounts = resolveInvoiceAmountFieldsFromInput({
      amountCents: 10000,
      applyProcessingFee: true,
      paymentMethod: "venmo",
    });
    expect(amounts.amountCents).toBe(10300);
  });

  it("resolves create input with fee for quickbooks", () => {
    const amounts = resolveInvoiceAmountFieldsFromInput({
      amountCents: 10000,
      applyProcessingFee: true,
      paymentMethod: "quickbooks",
    });
    expect(amounts.amountCents).toBe(10300);
  });

  it("ignores fee when method does not support it", () => {
    const amounts = resolveInvoiceAmountFieldsFromInput({
      amountCents: 10000,
      applyProcessingFee: true,
      paymentMethod: "zelle",
    });
    expect(amounts.amountCents).toBe(10000);
    expect(amounts.processingFeeCents).toBe(0);
  });
});
