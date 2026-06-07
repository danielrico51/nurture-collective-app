import { describe, expect, it } from "vitest";
import { generateCandidateSlots } from "@/lib/scheduling/google/slotGeneration";

const testConfig = {
  timezone: "America/New_York",
  workDays: [1, 2, 3, 4, 5],
  workHoursStart: "09:00",
  workHoursEnd: "17:00",
  durationMinutes: 30,
  bufferMinutes: 15,
  maxSlotsReturned: 24,
};

describe("generateCandidateSlots", () => {
  it("skips intervals that overlap busy blocks", () => {
    const from = new Date("2026-06-09T13:00:00.000Z");
    const to = new Date("2026-06-09T22:00:00.000Z");
    const slots = generateCandidateSlots({
      from,
      to,
      config: testConfig,
      busy: [
        {
          start: new Date("2026-06-09T14:00:00.000Z"),
          end: new Date("2026-06-09T15:00:00.000Z"),
        },
      ],
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(
      slots.every(
        (slot) =>
          !(
            new Date(slot.start) < new Date("2026-06-09T15:00:00.000Z") &&
            new Date(slot.end) > new Date("2026-06-09T14:00:00.000Z")
          )
      )
    ).toBe(true);
  });
});
