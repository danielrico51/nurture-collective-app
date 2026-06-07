import { serverBookingConfig } from "@/config/bookings";
import { serverIntegrations } from "@/config/integrations";
import { notifyConsultBooked } from "@/lib/integrations/slack";
import { syncLeadFromConsultBooking } from "@/lib/leads/storage";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { ConsultBooking } from "@/lib/scheduling/types";
import type { LeadRecord } from "@/types/lead";

export const runConsultBookingIntegrations = async (input: {
  userId: string;
  userEmail?: string | null;
  booking: ConsultBooking;
}): Promise<LeadRecord | null> => {
  let lead: LeadRecord | null = null;
  let isNewConsultSchedule = true;

  try {
    const result = await syncLeadFromConsultBooking({
      userId: input.userId,
      userEmail: input.userEmail,
      booking: input.booking,
    });
    lead = result.lead;
    isNewConsultSchedule = result.isNewConsultSchedule;
  } catch (error) {
    console.error("[scheduling] CRM sync failed:", error);
  }

  if (!isNewConsultSchedule) {
    return lead;
  }

  void notifyConsultBooked({
    inviteeName: input.booking.attendeeName,
    inviteeEmail: input.booking.attendeeEmail,
    eventName: "Maternal Support Introductory Call",
    startTime: input.booking.start,
    timezone: input.booking.timezone,
    bookingUrl: input.booking.htmlLink,
    leadId: lead?.leadId,
  }).catch((error) => {
    console.error("[scheduling] Slack notification failed:", error);
  });

  void forwardToN8n(
    serverBookingConfig.n8nGoogleBookingsWebhookUrl ||
      serverIntegrations.n8nInquiryWebhookUrl,
    serverIntegrations.n8nWebhookSecret,
    {
      source: "concierge-scheduling",
      receivedAt: new Date().toISOString(),
      booking: input.booking,
      lead,
    }
  ).catch((error) => {
    console.error("[scheduling] n8n forward failed:", error);
  });

  return lead;
};
