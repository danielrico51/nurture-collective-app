import {
  buildSchedulingAuthErrorMessage,
  CALENDAR_OWNER_EMAIL,
  classifyGoogleAuthFailure,
} from "@/lib/scheduling/calendarDeployGuards";

type GaxiosLikeError = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: string;
        errors?: Array<{ reason?: string; message?: string }>;
      };
    };
  };
};

export const extractGoogleApiErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return String(error);
  }

  const gaxios = error as GaxiosLikeError;
  const apiMessage = gaxios.response?.data?.error?.message?.trim();
  if (apiMessage) return apiMessage;

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return String(error);
};

export const formatClassCalendarSyncError = (
  error: unknown,
  options?: { calendarId?: string; delegatedUser?: string }
): string => {
  const raw = extractGoogleApiErrorMessage(error);
  const lower = raw.toLowerCase();
  const delegatedUser = options?.delegatedUser ?? CALENDAR_OWNER_EMAIL;
  const calendarId = options?.calendarId;

  const authFailure = classifyGoogleAuthFailure(raw);
  if (authFailure.kind !== "unknown") {
    return buildSchedulingAuthErrorMessage(delegatedUser, raw);
  }

  if (
    lower.includes("not found") ||
    lower.includes("notfound") ||
    lower.includes("404")
  ) {
    return (
      `Classes calendar not found or not visible to ${delegatedUser}. ` +
      `Confirm CLASS_EVENTS_GOOGLE_CALENDAR_ID${calendarId ? ` (${calendarId})` : ""} ` +
      `and share that calendar with ${delegatedUser} (Make changes to events).`
    );
  }

  if (
    lower.includes("writer access") ||
    lower.includes("forbidden") ||
    lower.includes("403") ||
    lower.includes("insufficient")
  ) {
    return (
      `${delegatedUser} does not have permission to add events to the classes calendar. ` +
      `In Google Calendar, open the classes calendar → Settings → Share with specific people → ` +
      `add ${delegatedUser} with "Make changes to events".`
    );
  }

  return raw;
};
