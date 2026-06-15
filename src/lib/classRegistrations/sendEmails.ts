import { classRegistrationEmailConfig } from "@/config/classRegistrations";
import { sendEmail } from "@/lib/email/sendEmail";
import type { SendEmailInput } from "@/lib/email/types";
import {
  buildAdminRegistrationAlertEmail,
  buildInstructorRegistrationAlertEmail,
  buildRegistrantConfirmationEmail,
} from "@/lib/classRegistrations/emailContent";
import { buildProviderRosterUrl } from "@/lib/classRegistrations/providerAccess";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

export type ClassRegistrationEmailSendResult = {
  registrant: boolean;
  admin: boolean;
  instructor: boolean;
  errors: string[];
  providers: string[];
};

const replyTo = () => {
  const reply = classRegistrationEmailConfig.emailReplyTo;
  return reply ? [reply] : undefined;
};

const sendOne = async (
  label: string,
  input: SendEmailInput,
  errors: string[],
  providers: string[]
): Promise<boolean> => {
  try {
    const result = await sendEmail(input);
    providers.push(`${label}:${result.provider}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${label}: ${message}`);
    console.error(`[class-registrations] ${label} email failed:`, error);
    return false;
  }
};

export const sendClassRegistrationEmails = async (
  event: EventItem,
  registration: ClassRegistration
): Promise<ClassRegistrationEmailSendResult> => {
  const from = classRegistrationEmailConfig.emailFrom;
  const result: ClassRegistrationEmailSendResult = {
    registrant: false,
    admin: false,
    instructor: false,
    errors: [],
    providers: [],
  };

  if (!classRegistrationEmailConfig.emailEnabled || !from) {
    return result;
  }

  const reply = replyTo();
  const registrantEmail = buildRegistrantConfirmationEmail(event, registration);
  result.registrant = await sendOne(
    "registrant",
    {
      from,
      to: [registration.registrantEmail],
      subject: registrantEmail.subject,
      text: registrantEmail.text,
      html: registrantEmail.html,
      replyTo: reply,
    },
    result.errors,
    result.providers
  );

  const adminTo = classRegistrationEmailConfig.adminEmail;
  if (adminTo) {
    const adminEmail = buildAdminRegistrationAlertEmail(event, registration);
    result.admin = await sendOne(
      "admin",
      {
        from,
        to: [adminTo],
        subject: adminEmail.subject,
        text: adminEmail.text,
        html: adminEmail.html,
        replyTo: reply,
      },
      result.errors,
      result.providers
    );
  }

  const instructorTo = event.instructorEmail?.trim();
  if (instructorTo) {
    const instructorEmail = buildInstructorRegistrationAlertEmail(
      event,
      registration,
      { rosterUrl: buildProviderRosterUrl(event) }
    );
    result.instructor = await sendOne(
      "instructor",
      {
        from,
        to: [instructorTo],
        subject: instructorEmail.subject,
        text: instructorEmail.text,
        html: instructorEmail.html,
        replyTo: reply,
      },
      result.errors,
      result.providers
    );
  }

  return result;
};
