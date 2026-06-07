import { serverSchedulingConfig } from "@/lib/scheduling/config";
import { getCalendarApi } from "@/lib/scheduling/google/client";
import { generateCandidateSlots, type BusyInterval } from "@/lib/scheduling/google/slotGeneration";
import type { SchedulingAvailabilityResponse } from "@/lib/scheduling/types";

const parseBusyIntervals = (
  calendars: Record<string, { busy?: Array<{ start?: string | null; end?: string | null }> }> | undefined,
  calendarId: string
): BusyInterval[] => {
  const busy = calendars?.[calendarId]?.busy ?? [];
  return busy
    .map((block) => {
      if (!block.start || !block.end) return null;
      return { start: new Date(block.start), end: new Date(block.end) };
    })
    .filter((block): block is BusyInterval => block !== null);
};

export const listAvailableSlots = async (options?: {
  horizonDays?: number;
}): Promise<SchedulingAvailabilityResponse> => {
  const {
    calendarId,
    timezone,
    availabilityHorizonDays,
    minLeadTimeHours,
  } = serverSchedulingConfig;

  const horizon = options?.horizonDays ?? availabilityHorizonDays;
  const now = new Date();
  const from = new Date(now.getTime() + minLeadTimeHours * 60 * 60 * 1000);
  const to = new Date(from.getTime() + horizon * 24 * 60 * 60 * 1000);

  const api = await getCalendarApi();
  const { data } = await api.freebusy.query({
    requestBody: {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: timezone,
      items: [{ id: calendarId }],
    },
  });

  const busy = parseBusyIntervals(data.calendars ?? undefined, calendarId);
  const slots = generateCandidateSlots({
    busy,
    from,
    to,
    config: {
      timezone,
      workDays: serverSchedulingConfig.workDays,
      workHoursStart: serverSchedulingConfig.workHoursStart,
      workHoursEnd: serverSchedulingConfig.workHoursEnd,
      durationMinutes: serverSchedulingConfig.durationMinutes,
      bufferMinutes: serverSchedulingConfig.bufferMinutes,
      maxSlotsReturned: serverSchedulingConfig.maxSlotsReturned,
    },
  });

  return { timezone, slots };
};

export const isSlotStillAvailable = async (
  slotStart: string,
  slotEnd: string
): Promise<boolean> => {
  const { calendarId, timezone } = serverSchedulingConfig;
  const api = await getCalendarApi();
  const { data } = await api.freebusy.query({
    requestBody: {
      timeMin: slotStart,
      timeMax: slotEnd,
      timeZone: timezone,
      items: [{ id: calendarId }],
    },
  });

  const busy = parseBusyIntervals(data.calendars ?? undefined, calendarId);
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  return !busy.some(
    (interval) => start < interval.end && end > interval.start
  );
};
