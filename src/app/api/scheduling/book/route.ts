import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserOrGuest } from "@/lib/api/authHelpers";
import { serverBookingConfig } from "@/config/bookings";
import { notifyConsultBooked } from "@/lib/integrations/slack";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import { serverIntegrations } from "@/config/integrations";
import { isGoogleSchedulingActive } from "@/lib/scheduling/config";
import {
  createIntroCallBooking,
  resolveSlotEnd,
} from "@/lib/scheduling/google/book";
import { handleSchedulingError } from "@/lib/scheduling/handleSchedulingError";
import {
  findBookingByIdempotencyKey,
  saveBookingIdempotency,
  saveConsultBooking,
} from "@/lib/scheduling/storage";
import type { SchedulingBookRequest } from "@/lib/scheduling/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAuthUserOrGuest(request);
  if (auth.error) return auth.error;

  if (!isGoogleSchedulingActive()) {
    return NextResponse.json(
      { error: "Live scheduling is not enabled" },
      { status: 503 }
    );
  }

  let body: SchedulingBookRequest;
  try {
    body = (await request.json()) as SchedulingBookRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slotStart = body.slotStart?.trim();
  const attendeeName = body.attendee?.name?.trim();
  const attendeeEmail = body.attendee?.email?.trim();

  if (!slotStart || !attendeeName || !attendeeEmail) {
    return NextResponse.json(
      { error: "slotStart, attendee.name, and attendee.email are required" },
      { status: 400 }
    );
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (idempotencyKey) {
    const existing = await findBookingByIdempotencyKey(
      auth.user!.sub,
      idempotencyKey
    );
    if (existing) {
      return NextResponse.json({ booking: existing });
    }
  }

  try {
    const slotEnd = resolveSlotEnd(slotStart);
    const booking = await createIntroCallBooking({
      userId: auth.user!.sub,
      slotStart,
      slotEnd,
      conversationSessionId: body.conversationSessionId,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        phone: body.attendee.phone?.trim(),
      },
    });

    await saveConsultBooking(booking);
    if (idempotencyKey) {
      await saveBookingIdempotency(auth.user!.sub, idempotencyKey, booking);
    }

    void notifyConsultBooked({
      inviteeName: booking.attendeeName,
      inviteeEmail: booking.attendeeEmail,
      eventName: "Maternal Support Introductory Call",
      startTime: booking.start,
      timezone: booking.timezone,
      bookingUrl: booking.htmlLink,
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
        booking,
      }
    ).catch((error) => {
      console.error("[scheduling] n8n forward failed:", error);
    });

    return NextResponse.json({ booking });
  } catch (error) {
    return handleSchedulingError(error);
  }
}
