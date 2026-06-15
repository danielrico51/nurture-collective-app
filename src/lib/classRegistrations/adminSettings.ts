import {
  classRegistrationCheckoutConfig,
  classRegistrationEmailConfig,
  classRegistrationPaymentConfig,
} from "@/config/classRegistrations";
import { classCalendarConfig, isClassCalendarSyncEnabled } from "@/config/classCalendar";
import { classRegistrationConfig } from "@/lib/classRegistrations/config";
import { eventsStorageConfig } from "@/lib/events/config";
import { toAbsoluteUrl } from "@/config/siteUrl";
import type { ClassRegistrationAdminSettings } from "@/types/classRegistrationAdmin";

export type { ClassRegistrationAdminSettings };

export const getClassRegistrationAdminSettings =
  (): ClassRegistrationAdminSettings => ({
    email: {
      enabled: classRegistrationEmailConfig.emailEnabled,
      configured: Boolean(
        classRegistrationEmailConfig.emailEnabled &&
          classRegistrationEmailConfig.emailFrom &&
          (classRegistrationEmailConfig.emailProvider !== "resend" ||
            classRegistrationEmailConfig.resendApiKey)
      ),
      from: classRegistrationEmailConfig.emailFrom || null,
      replyTo: classRegistrationEmailConfig.emailReplyTo || null,
      provider: classRegistrationEmailConfig.emailProvider,
      adminEmail: classRegistrationEmailConfig.adminEmail || null,
    },
    payments: {
      stripeEnabled: classRegistrationPaymentConfig.stripeEnabled,
      venmoEnabled: classRegistrationPaymentConfig.venmoEnabled,
      venmoHandle: classRegistrationPaymentConfig.venmoHandle || null,
      publicPaymentsEnabled: classRegistrationCheckoutConfig.paymentsEnabled,
      publicStripeEnabled: classRegistrationCheckoutConfig.stripeEnabled,
      publicVenmoHandle: classRegistrationCheckoutConfig.venmoHandle || null,
    },
    calendar: {
      syncEnabled: isClassCalendarSyncEnabled(),
      calendarId: classCalendarConfig.calendarId || null,
    },
    storage: {
      deploymentEnvironment: eventsStorageConfig.deploymentEnvironment,
      eventsBucket: eventsStorageConfig.bucket,
      eventsKey: eventsStorageConfig.s3Key,
      registrationsBucket: classRegistrationConfig.s3Bucket,
      registrationsPrefix: classRegistrationConfig.s3Prefix,
    },
    links: {
      bookClassesUrl: toAbsoluteUrl("/book/classes"),
      eventsAdminUrl: toAbsoluteUrl("/admin/events"),
    },
  });
