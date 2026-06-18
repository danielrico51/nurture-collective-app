import { describe, expect, it } from "vitest";
import {
  parseFeeItemsInput,
  resolveServiceTotalFeeCents,
  sumFeeItemsCents,
} from "@/lib/client-services/feeItems";

describe("client service fee items", () => {
  it("sums fee item amounts", () => {
    expect(
      sumFeeItemsCents([
        { id: "1", label: "Doula fee", amountCents: 120000 },
        { id: "2", label: "TNP", amountCents: 25000 },
        { id: "3", label: "Transportation", amountCents: 5000 },
      ])
    ).toBe(150000);
  });

  it("parses fee item input", () => {
    const items = parseFeeItemsInput([
      { label: "Doula fee", amountCents: 7425 },
      { label: "TNP", amountCents: 8000 },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0].label).toBe("Doula fee");
    expect(items[1].amountCents).toBe(8000);
  });

  it("uses itemized total when fee items are present", () => {
    const total = resolveServiceTotalFeeCents({
      feeItems: [
        { id: "1", label: "Doula fee", amountCents: 10000 },
        { id: "2", label: "TNP", amountCents: 5425 },
      ],
    });
    expect(total).toBe(15425);
  });

  it("falls back to explicit total when no fee items", () => {
    expect(
      resolveServiceTotalFeeCents({
        feeItems: [],
        totalFeeCents: 15425,
      })
    ).toBe(15425);
  });
});
