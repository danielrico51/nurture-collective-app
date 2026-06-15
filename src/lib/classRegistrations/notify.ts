import { hasClassRegistrationEmailDelivery } from "@/config/classRegistrations";
import { sendClassRegistrationEmails } from "@/lib/classRegistrations/sendEmails";
import { writeClassRegistration } from "@/lib/classRegistrations/storage";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

export const notifyClassRegistration = async (
  event: EventItem,
  registration: ClassRegistration
): Promise<ClassRegistration> => {
  if (!hasClassRegistrationEmailDelivery()) {
    return registration;
  }

  const emailResult = await sendClassRegistrationEmails(event, registration);
  const updated: ClassRegistration = {
    ...registration,
    emailDelivery: {
      lastAttemptAt: new Date().toISOString(),
      registrant: emailResult.registrant,
      admin: emailResult.admin,
      instructor: emailResult.instructor,
      errors: emailResult.errors.length ? emailResult.errors : undefined,
    },
    updatedAt: new Date().toISOString(),
  };

  await writeClassRegistration(updated);

  console.info("[class-registrations] email delivery results", {
    registrationId: registration.id,
    eventSlug: event.slug,
    registrantEmail: registration.registrantEmail,
    ...emailResult,
  });

  if (emailResult.errors.length > 0) {
    console.warn("[class-registrations] Some emails failed:", emailResult.errors);
  }

  return updated;
};
