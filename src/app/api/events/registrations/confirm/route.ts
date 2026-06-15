import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { classRegistrationPaymentConfig } from "@/config/classRegistrations";
import { completeClassRegistrationPayment } from "@/lib/classRegistrations/completePayment";
import { readClassRegistration } from "@/lib/classRegistrations/storage";

export const dynamic = "force-dynamic";

/** Confirm Stripe Checkout after redirect (backup if webhook is delayed). */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const secretKey = classRegistrationPaymentConfig.stripeSecretKey;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const registrationId = session.metadata?.orderId?.trim();
    const orderType = session.metadata?.orderType?.trim();

    if (!registrationId || orderType !== "class_registration") {
      return NextResponse.json({ error: "Registration not found on session" }, { status: 404 });
    }

    if (session.payment_status === "paid") {
      await completeClassRegistrationPayment({
        registrationId,
        paymentProvider: "stripe",
        paymentReference: session.payment_intent
          ? String(session.payment_intent)
          : session.id,
      });
    }

    const registration = await readClassRegistration(registrationId);
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      registrationId: registration.id,
      paymentStatus: registration.paymentStatus,
      eventSlug: registration.eventSlug,
    });
  } catch (error) {
    console.error("[class-registrations/confirm] failed:", error);
    const message =
      error instanceof Error ? error.message : "Could not confirm payment";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
