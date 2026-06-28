import { describe, expect, it } from "vitest";
import {
  ScheduleValidationError,
  validateCreateServiceEngagementInput,
} from "@/lib/schedule/validation";

describe("validateCreateServiceEngagementInput", () => {
  it("accepts a minimal engagement payload", () => {
    const input = validateCreateServiceEngagementInput({
      bookDate: "2026-01-06",
      package: { clientFeeCents: 540000 },
    });
    expect(input.bookDate).toBe("2026-01-06");
    expect(input.scheduleYear).toBe(2026);
    expect(input.serviceType).toBe("postpartum");
    expect(input.package.clientFeeCents).toBe(540000);
  });

  it("parses deposit and balance expectations", () => {
    const input = validateCreateServiceEngagementInput({
      bookDate: "2026-01-06",
      package: { clientFeeCents: 540000 },
      deposit: { amountCents: 500000, paidAt: "2026-01-06T00:00:00.000Z" },
      balance: {
        amountCents: 40000,
        dueDate: "2026-01-12",
        dueLabel: "after 1st wk",
      },
    });
    expect(input.deposit?.kind).toBe("deposit");
    expect(input.balance?.dueLabel).toBe("after 1st wk");
  });

  it("rejects invalid book dates", () => {
    expect(() =>
      validateCreateServiceEngagementInput({
        bookDate: "1/6/2026",
        package: { clientFeeCents: 100 },
      })
    ).toThrow(ScheduleValidationError);
  });

  it("parses preferred payment method", () => {
    const input = validateCreateServiceEngagementInput({
      bookDate: "2026-01-06",
      package: { clientFeeCents: 540000 },
      preferredPaymentMethod: "venmo",
    });
    expect(input.preferredPaymentMethod).toBe("venmo");
  });

  it("rejects invalid preferred payment method", () => {
    expect(() =>
      validateCreateServiceEngagementInput({
        bookDate: "2026-01-06",
        package: { clientFeeCents: 100 },
        preferredPaymentMethod: "cash",
      })
    ).toThrow(ScheduleValidationError);
  });

  it("rejects stripe as preferred payment method", () => {
    expect(() =>
      validateCreateServiceEngagementInput({
        bookDate: "2026-01-06",
        package: { clientFeeCents: 100 },
        preferredPaymentMethod: "stripe",
      })
    ).toThrow(/Stripe is not available for engagements/i);
  });
});
