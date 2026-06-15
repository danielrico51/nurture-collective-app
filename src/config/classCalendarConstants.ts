/** Classes & events calendar — separate from GOOGLE_CALENDAR_ID (intro / lead calls). */
export const DEFAULT_CLASS_EVENTS_GOOGLE_CALENDAR_ID =
  "c_6c4c40e2772622371ffcd13d9f51dd52474ad5f05740f10faf1d4468a272f415@group.calendar.google.com";

export const DEFAULT_CLASS_EVENTS_CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=c_6c4c40e2772622371ffcd13d9f51dd52474ad5f05740f10faf1d4468a272f415%40group.calendar.google.com&ctz=America%2FNew_York";

export const DEFAULT_CLASS_EVENTS_CALENDAR_TIMEZONE = "America/New_York";

export const buildClassCalendarEmbedUrl = (
  calendarId: string,
  timezone = DEFAULT_CLASS_EVENTS_CALENDAR_TIMEZONE
): string => {
  const params = new URLSearchParams({
    src: calendarId,
    ctz: timezone,
  });
  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
};
