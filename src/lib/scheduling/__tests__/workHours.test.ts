import { describe, expect, it } from "vitest";
import {
  filterSlotsWithinConfiguredWorkHours,
  isSlotWithinConfiguredWorkHours,
} from "@/lib/scheduling/workHours";
import { generateCandidateSlots } from "@/lib/scheduling/google/slotGeneration";

const workHoursConfig = {
  timezone: "America/New_York",
  workDays: [1, 2, 3, 4, 5],
  workHoursStart: "10:00",
  workHoursEnd: "15:00",
  durationMinutes: 30,
};

describe("scheduling work hours", () => {
  it("accepts slots inside configured hours", () => {
    expect(
      isSlotWithinConfiguredWorkHours(
        "2026-06-10T14:00:00.000Z",
        "2026-06-10T14:30:00.000Z",
        workHoursConfig
      )
    ).toBe(true);
  });

  it("rejects slots outside configured hours", () => {
    expect(
      isSlotWithinConfiguredWorkHours(
        "2026-06-10T12:00:00.000Z",
        "2026-06-10T12:30:00.000Z",
        workHoursConfig
      )
    ).toBe(false);
    expect(
      isSlotWithinConfiguredWorkHours(
        "2026-06-10T20:00:00.000Z",
        "2026-06-10T20:30:00.000Z",
        workHoursConfig
      )
    ).toBe(false);
  });

  it("rejects weekend slots", () => {
    expect(
      isSlotWithinConfiguredWorkHours(
        "2026-06-13T14:00:00.000Z",
        "2026-06-13T14:30:00.000Z",
        workHoursConfig
      )
    ).toBe(false);
  });
});

describe("generateCandidateSlots work-hour filtering", () => {
  it("only returns slots inside configured hours", () => {
    const from = new Date("2026-06-10T13:00:00.000Z");
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    const slots = generateCandidateSlots({
      from,
      to,
      busy: [],
      config: {
        ...workHoursConfig,
        bufferMinutes: 15,
        maxSlotsReturned: 50,
      },
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(filterSlotsWithinConfiguredWorkHours(slots, workHoursConfig)).toEqual(
      slots
    );
    expect(
      slots.every((slot) =>
        isSlotWithinConfiguredWorkHours(slot.start, slot.end, workHoursConfig)
      )
    ).toBe(true);
  });
});
