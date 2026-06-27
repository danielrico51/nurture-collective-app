import { describe, expect, it } from "vitest";
import {
  addEngagementToStreamTotals,
  emptyStreamTotals,
  streamClientFeeCents,
} from "@/lib/dashboard/revenueStreams";

describe("revenueStreams", () => {
  it("accumulates birth and postpartum fees separately", () => {
    const totals = emptyStreamTotals();
    addEngagementToStreamTotals("birth", 230_000, 100_000, totals);
    addEngagementToStreamTotals("postpartum", 540_000, 320_000, totals);

    expect(totals.birthCount).toBe(1);
    expect(totals.postpartumCount).toBe(1);
    expect(streamClientFeeCents(totals, "birth")).toBe(230_000);
    expect(streamClientFeeCents(totals, "postpartum")).toBe(540_000);
  });
});
