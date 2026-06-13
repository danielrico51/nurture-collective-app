import {
  GoogleAuth,
  Impersonated,
  JWT,
  type AuthClient,
} from "google-auth-library";
import { google } from "googleapis";
import { serverGoogleTasksConfig } from "@/config/googleTasks";
import { createDelegatedGoogleAuthClient } from "@/lib/integrations/google/delegatedAuth";
import {
  isGoogleSchedulingConfigured,
  serverSchedulingConfig,
} from "@/lib/scheduling/config";
import { SchedulingNotConfiguredError } from "@/lib/scheduling/errors";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

const readServiceAccountCredentials = (): {
  client_email: string;
  private_key: string;
} => {
  const json =
    serverSchedulingConfig.serviceAccountJson ||
    serverGoogleTasksConfig.serviceAccountJson;
  const email =
    serverSchedulingConfig.serviceAccountEmail ||
    serverGoogleTasksConfig.serviceAccountEmail;
  const key =
    serverSchedulingConfig.serviceAccountPrivateKey ||
    serverGoogleTasksConfig.serviceAccountPrivateKey;

  if (json) {
    const parsed = JSON.parse(json) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) {
      throw new SchedulingNotConfiguredError(
        "GOOGLE_SERVICE_ACCOUNT_JSON is missing email or key"
      );
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    };
  }

  if (!email || !key) {
    throw new SchedulingNotConfiguredError(
      "Google service account credentials are not configured for scheduling"
    );
  }

  return { client_email: email, private_key: key };
};

const createUserAdcClient = async (): Promise<AuthClient> => {
  const auth = new GoogleAuth({ scopes: [CALENDAR_SCOPE] });
  return auth.getClient();
};

const createImpersonatedClient = async (): Promise<AuthClient> => {
  const sourceAuth = new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });
  const sourceClient = await sourceAuth.getClient();

  return new Impersonated({
    sourceClient,
    targetPrincipal: serverSchedulingConfig.impersonateServiceAccount,
    targetScopes: [CALENDAR_SCOPE],
    lifetime: 3600,
  });
};

export const createGoogleCalendarAuthClient = async (): Promise<AuthClient> => {
  if (!isGoogleSchedulingConfigured()) {
    throw new SchedulingNotConfiguredError();
  }

  switch (serverSchedulingConfig.authMode) {
    case "delegated":
    case "wif":
      return createDelegatedGoogleAuthClient({
        scope: CALENDAR_SCOPE,
        subject: serverSchedulingConfig.delegatedUser,
        serviceAccount: serverSchedulingConfig.impersonateServiceAccount,
        adcJson: serverSchedulingConfig.adcJson,
      });
    case "adc":
      return createUserAdcClient();
    case "impersonate":
      return createImpersonatedClient();
    default: {
      const credentials = readServiceAccountCredentials();
      return new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [CALENDAR_SCOPE],
        subject: serverSchedulingConfig.delegatedUser || undefined,
      });
    }
  }
};

export const getCalendarApi = async () => {
  const auth = await createGoogleCalendarAuthClient();
  return google.calendar({
    version: "v3",
    auth: auth as unknown as Parameters<typeof google.calendar>[0]["auth"],
  });
};
