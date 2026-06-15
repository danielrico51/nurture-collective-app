import { classRegistrationPaymentConfig } from "@/config/classRegistrations";
import { createClassRegistrationStripeCheckout } from "@/lib/classRegistrations/stripeCheckout";
import {
  buildVenmoPaymentNote,
  buildVenmoPaymentUrl,
  registrationRequiresPayment,
} from "@/lib/classRegistrations/payments";
import { writeClassRegistration } from "@/lib/classRegistrations/storage";
import type {
  ClassRegistration,
  ClassRegistrationPaymentInfo,
} from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

export const startClassRegistrationPayment = async (
  event: EventItem,
  registration: ClassRegistration,
  urls: { successUrl: string; cancelUrl: string }
): Promise<ClassRegistrationPaymentInfo | undefined> => {
  if (!registrationRequiresPayment(registration)) {
    return undefined;
  }

  if (registration.paymentMethod === "stripe") {
    const checkout = await createClassRegistrationStripeCheckout(
      event,
      registration,
      urls
    );
    return {
      required: true,
      method: "stripe",
      checkoutUrl: checkout.checkoutUrl,
      amountCents: registration.amountCents,
      message: "Complete payment to finalize your registration.",
    };
  }

  if (registration.paymentMethod === "venmo") {
    const handle = classRegistrationPaymentConfig.venmoHandle;
    const venmoUrl = buildVenmoPaymentUrl({
      handle,
      amountCents: registration.amountCents,
      note: buildVenmoPaymentNote(event, registration),
    });

    await writeClassRegistration({
      ...registration,
      paymentProvider: "venmo",
      updatedAt: new Date().toISOString(),
    });

    return {
      required: true,
      method: "venmo",
      venmoUrl,
      venmoHandle: handle,
      amountCents: registration.amountCents,
      message: `Send ${(registration.amountCents / 100).toFixed(2)} via Venmo to @${handle.replace(/^@/, "")} and include your registration note.`,
    };
  }

  return undefined;
};
