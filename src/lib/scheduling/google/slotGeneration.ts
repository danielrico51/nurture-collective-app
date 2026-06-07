import type { SchedulingSlot } from "@/lib/scheduling/types";
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

export interface SlotGenerationConfig {
  timezone: string;
  workDays: number[];
  workHoursStart: string;
  workHoursEnd: string;
  durationMinutes: number;
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
  const daySpan = Math.max(
    1,
    Math.ceil((input.to.getTime() - input.from.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );

  for (let dayOffset = 0; dayOffset < daySpan && slots.length < maxSlotsReturned; dayOffset += 1) {
    const probe = new Date(input.from.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const parts = getZonedParts(probe, timezone);
    const jsDay = weekdayToJsDay(parts.weekday);
    if (!workDays.includes(jsDay)) continue;

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

  return slots;
};
