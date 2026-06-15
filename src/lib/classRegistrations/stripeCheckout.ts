import Stripe from "stripe";
import { classRegistrationPaymentConfig } from "@/config/classRegistrations";
import { writeClassRegistration } from "@/lib/classRegistrations/storage";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

const getStripe = (): Stripe => {
  const key = classRegistrationPaymentConfig.stripeSecretKey;
  if (!key) {
    throw new Error("Stripe is not configured for class registrations");
  }
  return new Stripe(key);
};

const formatStripeError = (error: unknown): string => {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Stripe checkout failed";
};

export const createClassRegistrationStripeCheckout = async (
  event: EventItem,
  registration: ClassRegistration,
  urls: { successUrl: string; cancelUrl: string }
): Promise<{ checkoutUrl: string; sessionId: string }> => {
  const stripe = getStripe();
  const amountCents = registration.amountCents;

  if (amountCents <= 0) {
    throw new Error("This registration does not require payment");
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: registration.registrantEmail,
      payment_intent_data: {
        receipt_email: registration.registrantEmail,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: event.title,
              description: `Class registration — ${event.title}`,
            },
          },
        },
      ],
      success_url: `${urls.successUrl}${urls.successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: urls.cancelUrl,
      metadata: {
        orderId: registration.id,
        orderType: "class_registration",
        eventSlug: event.slug,
        registrantEmail: registration.registrantEmail,
      },
    });
  } catch (error) {
    throw new Error(formatStripeError(error));
  }

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  await writeClassRegistration({
    ...registration,
    paymentMethod: "stripe",
    paymentProvider: "stripe",
    paymentReference: session.id,
    updatedAt: new Date().toISOString(),
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};
