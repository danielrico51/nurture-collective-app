import type { ConsultBookedDetails } from "@/lib/integrations/slack/messages";

interface CalendlyWebhookEnvelope {
  event?: string;
  payload?: Record<string, unknown>;
}

const readString = (value: unknown): string =>
  typeof value === "string" ? value : "";

/** Map Calendly invitee.created payloads to consult.booked Slack details. */
export const parseCalendlyConsultBooked = (
  body: unknown
): ConsultBookedDetails | null => {
  const envelope = body as CalendlyWebhookEnvelope;
  const eventName = envelope.event ?? "";
  if (!eventName.startsWith("invitee.")) return null;
  if (eventName === "invitee.canceled") return null;

  const payload = envelope.payload ?? {};
  const scheduledEvent =
    (payload.scheduled_event as Record<string, unknown> | undefined) ?? {};

  const inviteeName = readString(payload.name);
  const inviteeEmail = readString(payload.email);
  const meetingName =
    readString(scheduledEvent.name) || "Maternal Support Introductory Call";
  const startTime = readString(scheduledEvent.start_time);
  const timezone = readString(scheduledEvent.timezone);

  if (!inviteeName && !inviteeEmail) return null;

  return {
    inviteeName: inviteeName || inviteeEmail,
    inviteeEmail,
    eventName: meetingName,
    startTime,
    timezone: timezone || undefined,
    bookingUrl: readString(payload.reschedule_url) || undefined,
  };
};
