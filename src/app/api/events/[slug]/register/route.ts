import { NextRequest, NextResponse } from "next/server";
import { notifyClassRegistration } from "@/lib/classRegistrations/notify";
import {
  ClassRegistrationCapacityError,
  ClassRegistrationValidationError,
  createClassRegistration,
} from "@/lib/classRegistrations/service";
import { syncRegistrationToGoogleCalendar } from "@/lib/events/calendar/sync";
import { startClassRegistrationPayment } from "@/lib/classRegistrations/startPayment";
import { getRequestOriginFromNextRequest } from "@/lib/http/requestOrigin";
import { getEventBySlug } from "@/lib/events/storage";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const event = await getEventBySlug(params.slug);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const registration = await createClassRegistration(event, body);
    const notified = await notifyClassRegistration(event, registration);
    void syncRegistrationToGoogleCalendar(event, notified).catch((error) => {
      console.error("[events] calendar sync after registration failed:", error);
    });

    const origin = getRequestOriginFromNextRequest(request);
    const payment = await startClassRegistrationPayment(event, notified, {
      successUrl: `${origin}/events-and-classes/${event.slug}/register`,
      cancelUrl: `${origin}/events-and-classes/${event.slug}/register?cancelled=1`,
    });

    return NextResponse.json(
      {
        registration: notified,
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ClassRegistrationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ClassRegistrationCapacityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[events] register error:", error);
    return NextResponse.json(
      { error: "Could not complete registration" },
      { status: 500 }
    );
  }
}
