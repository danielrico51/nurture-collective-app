import { describe, expect, it } from "vitest";
import {
  normalizePaidAtIso,
  paymentProviderForMethod,
  resolveExpectationPaymentMethod,
} from "@/lib/schedule/expectationBilling";

describe("expectationBilling helpers", () => {
  it("defaults missing payment method to venmo", () => {
    expect(resolveExpectationPaymentMethod(null)).toBe("venmo");
    expect(resolveExpectationPaymentMethod(undefined)).toBe("venmo");
    expect(resolveExpectationPaymentMethod("")).toBe("venmo");
  });

  it("keeps engagement payment methods", () => {
    expect(resolveExpectationPaymentMethod("zelle")).toBe("zelle");
    expect(resolveExpectationPaymentMethod("quickbooks")).toBe("quickbooks");
  });

  it("maps legacy stripe engagements to quickbooks for invoicing", () => {
    expect(resolveExpectationPaymentMethod("stripe")).toBe("quickbooks");
  });

  it("maps payment methods to invoice payment providers", () => {
    expect(paymentProviderForMethod("stripe")).toBe("stripe");
    expect(paymentProviderForMethod("quickbooks")).toBe("quickbooks");
    expect(paymentProviderForMethod("venmo")).toBe("manual");
    expect(paymentProviderForMethod("zelle")).toBe("manual");
  });

  it("normalizes date-only paidAt values to ISO", () => {
    expect(normalizePaidAtIso("2026-03-15")).toBe("2026-03-15T12:00:00.000Z");
    expect(normalizePaidAtIso("2026-03-15T08:00:00.000Z")).toBe(
      "2026-03-15T08:00:00.000Z"
    );
  });
});
