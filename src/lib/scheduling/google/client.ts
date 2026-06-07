import { JWT, type AuthClient } from "google-auth-library";
import { google } from "googleapis";
import { serverGoogleTasksConfig } from "@/config/googleTasks";
import {
  isGoogleSchedulingConfigured,
  serverSchedulingConfig,
} from "@/lib/scheduling/config";
import { SchedulingNotConfiguredError } from "@/lib/scheduling/errors";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

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

export const createGoogleCalendarAuthClient = async (): Promise<AuthClient> => {
  if (!isGoogleSchedulingConfigured()) {
    throw new SchedulingNotConfiguredError();
  }

  const credentials = readServiceAccountCredentials();
  const subject = serverSchedulingConfig.delegatedUser || undefined;

  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [CALENDAR_SCOPE],
    subject,
  });
};

export const getCalendarApi = async () => {
  const auth = await createGoogleCalendarAuthClient();
  return google.calendar({
    version: "v3",
    auth: auth as unknown as Parameters<typeof google.calendar>[0]["auth"],
  });
};
