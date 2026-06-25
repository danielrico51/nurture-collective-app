import type { SchedulingSlot } from "@/lib/scheduling/types";
import {
  addCalendarDaysInZone,
  filterSlotsWithinConfiguredWorkHours,
  type SchedulingWorkHoursConfig,
} from "@/lib/scheduling/workHours";
import {
  formatSlotLabel,
  getZonedParts,
  parseWorkMinutes,
  weekdayToJsDay,
  zonedDateTimeToUtc,
} from "@/lib/scheduling/timezone";

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface SlotGenerationConfig extends SchedulingWorkHoursConfig {
  bufferMinutes: number;
  maxSlotsReturned: number;
}

const overlaps = (
  slotStart: Date,
  slotEnd: Date,
  busy: BusyInterval
): boolean => slotStart < busy.end && slotEnd > busy.start;

export const generateCandidateSlots = (input: {
  busy: BusyInterval[];
  from: Date;
  to: Date;
  config: SlotGenerationConfig;
}): SchedulingSlot[] => {
  const {
    timezone,
    workDays,
    workHoursStart,
    workHoursEnd,
    durationMinutes,
    bufferMinutes,
    maxSlotsReturned,
  } = input.config;

  const workStartMinutes = parseWorkMinutes(workHoursStart);
  const workEndMinutes = parseWorkMinutes(workHoursEnd);
  const stepMinutes = durationMinutes + bufferMinutes;
  const slots: SchedulingSlot[] = [];

  const fromParts = getZonedParts(input.from, timezone);
  const toParts = getZonedParts(input.to, timezone);
  const startDay = { year: fromParts.year, month: fromParts.month, day: fromParts.day };
  const endDay = { year: toParts.year, month: toParts.month, day: toParts.day };

  let dayCursor = startDay;
  let guard = 0;

  while (slots.length < maxSlotsReturned && guard < 400) {
    guard += 1;
    const parts = dayCursor;
    const jsDay = weekdayToJsDay(
      getZonedParts(
        zonedDateTimeToUtc(parts.year, parts.month, parts.day, 12, 0, timezone),
        timezone
      ).weekday
    );

    if (workDays.includes(jsDay)) {
      for (
        let minute = workStartMinutes;
        minute + durationMinutes <= workEndMinutes;
        minute += stepMinutes
      ) {
        const hour = Math.floor(minute / 60);
        const mins = minute % 60;
        const start = zonedDateTimeToUtc(
          parts.year,
          parts.month,
          parts.day,
          hour,
          mins,
          timezone
        );
        const end = new Date(start.getTime() + durationMinutes * 60_000);

        if (start < input.from || start > input.to) continue;
        if (input.busy.some((interval) => overlaps(start, end, interval))) {
          continue;
        }

        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: formatSlotLabel(start, timezone),
        });
        if (slots.length >= maxSlotsReturned) break;
      }
    }

    if (
      dayCursor.year === endDay.year &&
      dayCursor.month === endDay.month &&
      dayCursor.day === endDay.day
    ) {
      break;
    }

    dayCursor = addCalendarDaysInZone(
      dayCursor.year,
      dayCursor.month,
      dayCursor.day,
      1,
      timezone
    );
  }

  return filterSlotsWithinConfiguredWorkHours(slots, input.config);
};
