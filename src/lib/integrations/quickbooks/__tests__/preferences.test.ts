import { describe, expect, it } from "vitest";
import { parseQuickBooksPaymentsSetup } from "@/lib/integrations/quickbooks/preferences";

describe("parseQuickBooksPaymentsSetup", () => {
  it("reads online payment flags from SalesFormsPrefs", () => {
    const status = parseQuickBooksPaymentsSetup({
      ETransactionPaymentEnabled: true,
      AllowOnlineCreditCardPayment: true,
      AllowOnlineACHPayment: true,
    });

    expect(status.onlinePaymentsEnabled).toBe(true);
    expect(status.creditCardPaymentsEnabled).toBe(true);
    expect(status.achPaymentsEnabled).toBe(true);
    expect(status.surchargingHint).toBe("unknown");
  });

  it("detects surcharge preference keys when present", () => {
    const status = parseQuickBooksPaymentsSetup({
      ETransactionPaymentEnabled: true,
      CreditCardSurchargeEnabled: true,
    });

    expect(status.surchargingHint).toBe("enabled");
    expect(status.rawSurchargePreferenceKeys).toContain(
      "CreditCardSurchargeEnabled"
    );
  });

  it("reports disabled when surcharge preference is explicitly false", () => {
    const status = parseQuickBooksPaymentsSetup({
      ETransactionPaymentEnabled: true,
      SurchargeEnabled: false,
    });

    expect(status.surchargingHint).toBe("disabled");
  });
});
