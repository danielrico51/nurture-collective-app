import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/classCalendar", () => ({
  classCalendarConfig: {
    syncEnabled: true,
    calendarId: "classes@example.com",
    timezone: "America/New_York",
    defaultClassDurationMinutes: 120,
    defaultEventDurationMinutes: 60,
    defaultStartTime: "10:00",
  },
  isClassCalendarSyncEnabled: () => true,
}));

vi.mock("@/config/classRegistrations", () => ({
  classRegistrationEmailConfig: {
    emailEnabled: true,
    emailFrom: "info@nesting-place.com",
    emailReplyTo: "info@nesting-place.com",
    emailProvider: "ses",
    resendApiKey: "",
    adminEmail: "admin@nesting-place.com",
  },
  classRegistrationPaymentConfig: {
    stripeEnabled: true,
    venmoEnabled: true,
    venmoHandle: "@NestingPlace",
    stripeSecretKey: "sk_test",
  },
  classRegistrationCheckoutConfig: {
    paymentsEnabled: true,
    stripeEnabled: true,
    venmoHandle: "@NestingPlace",
  },
}));

vi.mock("@/lib/classRegistrations/config", () => ({
  classRegistrationConfig: {
    deploymentEnvironment: "dev",
    s3Prefix: "class-registrations/dev/",
    s3Bucket: "nurture-collective-tasks",
    useLocalStorage: false,
  },
}));

vi.mock("@/lib/events/config", () => ({
  eventsStorageConfig: {
    deploymentEnvironment: "dev",
    bucket: "nurture-collective-tasks",
    s3Key: "management/events/dev/items.json",
    useLocalStorage: false,
  },
}));

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");

import { getClassRegistrationAdminSettings } from "@/lib/classRegistrations/adminSettings";

describe("getClassRegistrationAdminSettings", () => {
  it("returns a safe admin settings snapshot", () => {
    const settings = getClassRegistrationAdminSettings();

    expect(settings.email.adminEmail).toBe("admin@nesting-place.com");
    expect(settings.payments.venmoHandle).toBe("@NestingPlace");
    expect(settings.calendar.syncEnabled).toBe(true);
    expect(settings.storage.eventsKey).toContain("management/events/");
    expect(settings.links.bookClassesUrl).toBe(
      "https://www.nesting-place.com/book/classes"
    );
  });
});
