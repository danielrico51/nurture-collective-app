import {
  resolveFreebusyCalendarIds,
  schedulingWorkHoursConfig,
  serverSchedulingConfig,
} from "@/lib/scheduling/config";
import { isSlotWithinConfiguredWorkHours } from "@/lib/scheduling/workHours";
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
    timezone,
    availabilityHorizonDays,
    minLeadTimeHours,
  } = serverSchedulingConfig;

  const horizon = options?.horizonDays ?? availabilityHorizonDays;
  const now = new Date();
  const from = new Date(now.getTime() + minLeadTimeHours * 60 * 60 * 1000);
  const to = new Date(from.getTime() + horizon * 24 * 60 * 60 * 1000);

  const api = await getCalendarApi();
  const calendarIds = resolveFreebusyCalendarIds();
  const { data } = await api.freebusy.query({
    requestBody: {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: timezone,
      items: calendarIds.map((id) => ({ id })),
    },
  });

  const busy = calendarIds.flatMap((calendarId) =>
    parseBusyIntervals(data.calendars ?? undefined, calendarId)
  );
  const slots = generateCandidateSlots({
    busy,
    from,
    to,
    config: {
      ...schedulingWorkHoursConfig(),
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
  const { timezone } = serverSchedulingConfig;
  const workHours = schedulingWorkHoursConfig();
  if (!isSlotWithinConfiguredWorkHours(slotStart, slotEnd, workHours)) {
    return false;
  }

  const calendarIds = resolveFreebusyCalendarIds();
  const api = await getCalendarApi();
  const { data } = await api.freebusy.query({
    requestBody: {
      timeMin: slotStart,
      timeMax: slotEnd,
      timeZone: timezone,
      items: calendarIds.map((id) => ({ id })),
    },
  });

  const busy = calendarIds.flatMap((calendarId) =>
    parseBusyIntervals(data.calendars ?? undefined, calendarId)
  );
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  return !busy.some(
    (interval) => start < interval.end && end > interval.start
  );
};
