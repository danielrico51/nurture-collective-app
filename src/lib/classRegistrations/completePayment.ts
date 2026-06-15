import { writeClassRegistration } from "@/lib/classRegistrations/storage";
import { readClassRegistration } from "@/lib/classRegistrations/storage";
import type { ClassRegistration } from "@/types/classRegistration";

export const completeClassRegistrationPayment = async (input: {
  registrationId: string;
  paymentProvider: string;
  paymentReference: string;
}): Promise<ClassRegistration> => {
  const registration = await readClassRegistration(input.registrationId);
  if (!registration) {
    throw new Error(`Registration not found: ${input.registrationId}`);
  }

  if (registration.paymentStatus === "paid") {
    return registration;
  }

  const updated: ClassRegistration = {
    ...registration,
    paymentStatus: "paid",
    paymentProvider: input.paymentProvider,
    paymentReference: input.paymentReference,
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeClassRegistration(updated);

  console.info("[class-registrations] payment completed", {
    registrationId: updated.id,
    eventSlug: updated.eventSlug,
    paymentProvider: input.paymentProvider,
    amountCents: updated.amountCents,
  });

  return updated;
};
