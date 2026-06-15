export type ClassRegistrationAdminSettings = {
  email: {
    enabled: boolean;
    configured: boolean;
    from: string | null;
    replyTo: string | null;
    provider: string;
    adminEmail: string | null;
  };
  payments: {
    stripeEnabled: boolean;
    venmoEnabled: boolean;
    venmoHandle: string | null;
    publicPaymentsEnabled: boolean;
    publicStripeEnabled: boolean;
    publicVenmoHandle: string | null;
  };
  calendar: {
    syncEnabled: boolean;
    calendarId: string | null;
    embedUrl: string | null;
  };
  storage: {
    deploymentEnvironment: string;
    eventsBucket: string;
    eventsKey: string;
    registrationsBucket: string;
    registrationsPrefix: string;
  };
  links: {
    bookClassesUrl: string;
    eventsAdminUrl: string;
  };
};
