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

export const fetchSchedulingStatus =
  async (): Promise<SchedulingStatusResponse> => {
    const response = await fetch("/api/scheduling/status", {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        enabled: false,
        configured: false,
        timezone: "America/New_York",
        durationMinutes: 30,
      };
    }
    return data as SchedulingStatusResponse;
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

  if (response.status === 503) return null;

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Could not load availability"
    );
  }

  return data as SchedulingAvailabilityResponse;
};

export const bookSchedulingSlot = async (input: {
  slotStart: string;
  conversationSessionId?: string;
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
      attendee: input.attendee,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Could not book that time"
    );
  }

  return data.booking as ConsultBooking;
};
