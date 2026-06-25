import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserOrGuestForScheduling } from "@/lib/api/authHelpers";
import { runConsultBookingIntegrations } from "@/lib/scheduling/bookingIntegrations";
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
  const auth = await requireAuthUserOrGuestForScheduling(request);
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
      notes: body.notes?.trim(),
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

    void runConsultBookingIntegrations({
      userId: auth.user!.sub,
      userEmail: auth.user!.email,
      cognitoSub: auth.user!.sub,
      booking,
    });

    return NextResponse.json({ booking });
  } catch (error) {
    return handleSchedulingError(error);
  }
}
