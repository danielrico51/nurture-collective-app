import { intakeRequestHeaders } from "@/lib/api/intakeRequestHeaders";
import type {
  ConsultBooking,
  SchedulingAvailabilityResponse,
} from "@/lib/scheduling/types";

export interface SchedulingStatusResponse {
  enabled: boolean;
  configured: boolean;
  timezone: string;
  durationMinutes: number;
}

const parseApiResponse = async (
  response: Response
): Promise<Record<string, unknown>> => {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const trimmed = text.trim();
    const isHtmlError =
      trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
    const message = isHtmlError
      ? `Scheduling is temporarily unavailable (server error ${response.status}). Wait a moment and try again, or use Book a call below.`
      : trimmed.slice(0, 200) || `Request failed (${response.status})`;
    throw new Error(message);
  }
};

export const fetchSchedulingStatus =
  async (): Promise<SchedulingStatusResponse> => {
    const response = await fetch("/api/scheduling/status", {
      cache: "no-store",
    });
    const data = await parseApiResponse(response);
    if (!response.ok) {
      return {
        enabled: false,
        configured: false,
        timezone: "America/New_York",
        durationMinutes: 30,
      };
    }
    return data as unknown as SchedulingStatusResponse;
  };

export const fetchSchedulingAvailability = async (options?: {
  days?: number;
}): Promise<SchedulingAvailabilityResponse | null> => {
  const params = new URLSearchParams();
  if (options?.days) params.set("days", String(options.days));

  const response = await fetch(
    `/api/scheduling/availability${params.size ? `?${params}` : ""}`,
    {
      headers: await intakeRequestHeaders(),
      cache: "no-store",
    }
  );

  const data = await parseApiResponse(response);

  if (response.status === 503) {
    if (typeof data.error === "string" && data.error.trim()) {
      throw new Error(data.error);
    }
    return null;
  }

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Could not load availability"
    );
  }

  return data as unknown as SchedulingAvailabilityResponse;
};

export const bookSchedulingSlot = async (input: {
  slotStart: string;
  conversationSessionId?: string;
  notes?: string;
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
  idempotencyKey?: string;
}): Promise<ConsultBooking> => {
  const headers = await intakeRequestHeaders();
  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };
  if (input.idempotencyKey) {
    requestHeaders["Idempotency-Key"] = input.idempotencyKey;
  }

  const response = await fetch("/api/scheduling/book", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({
      slotStart: input.slotStart,
      conversationSessionId: input.conversationSessionId,
      notes: input.notes,
      attendee: input.attendee,
    }),
  });

  const data = await parseApiResponse(response);
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Could not book that time"
    );
  }

  return data.booking as ConsultBooking;
};
