/**
 * Google Tasks sync.
 * @see docs/platform/google-tasks-sync.md
 */

export type GoogleTasksAuthMode =
  | "service_account"
  | "adc"
  | "impersonate"
  | "delegated"
  | "oauth"
  | "wif";

/** personal = each team member connects their Google account; legacy = single admin list */
export type GoogleTasksSyncMode = "personal" | "legacy";

const readAuthMode = (): GoogleTasksAuthMode => {
  const raw = process.env.GOOGLE_TASKS_AUTH_MODE?.trim().toLowerCase();
  if (
    raw === "adc" ||
    raw === "impersonate" ||
    raw === "service_account" ||
    raw === "delegated" ||
    raw === "oauth" ||
    raw === "wif"
  ) {
    return raw;
  }
  return "delegated";
};

const defaultImpersonateServiceAccount = () =>
  process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ||
  "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com";

const readSyncMode = (): GoogleTasksSyncMode => {
  const raw = process.env.GOOGLE_TASKS_SYNC_MODE?.trim().toLowerCase();
  if (raw === "personal" || raw === "legacy") return raw;
  const hasOAuthClient = Boolean(
    process.env.GOOGLE_TASKS_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_TASKS_OAUTH_CLIENT_SECRET?.trim()
  );
  return hasOAuthClient ? "personal" : "legacy";
};

export const serverGoogleTasksConfig = {
  enabled: process.env.GOOGLE_TASKS_ENABLED?.trim().toLowerCase() === "true",
  syncMode: readSyncMode(),
  authMode: readAuthMode(),
  /** Workspace user whose Tasks list is used (delegated/oauth modes). */
  delegatedUser:
    process.env.GOOGLE_TASKS_DELEGATED_USER?.trim() ||
    "admin@nesting-place.com",
  impersonateServiceAccount: defaultImpersonateServiceAccount(),
  /** Service account client ID for Workspace domain-wide delegation. */
  serviceAccountClientId:
    process.env.GOOGLE_TASKS_SERVICE_ACCOUNT_CLIENT_ID?.trim() ||
    "104446812720989008018",
  taskListId: process.env.GOOGLE_TASKS_LIST_ID?.trim() ?? "",
  taskListTitle:
    process.env.GOOGLE_TASKS_LIST_TITLE?.trim() || "Nesting Place Tasks",
  oauthClientId: process.env.GOOGLE_TASKS_OAUTH_CLIENT_ID?.trim() ?? "",
  oauthClientSecret: process.env.GOOGLE_TASKS_OAUTH_CLIENT_SECRET?.trim() ?? "",
  oauthRefreshToken:
    process.env.GOOGLE_TASKS_OAUTH_REFRESH_TOKEN?.trim() ?? "",
  oauthRedirectUri:
    process.env.GOOGLE_TASKS_OAUTH_REDIRECT_URI?.trim() ||
    "http://localhost:3333/oauth2callback",
  /** Amplify: paste application_default_credentials.json from gcloud auth application-default login */
  adcJson: process.env.GOOGLE_TASKS_ADC_JSON?.trim() ?? "",
  serviceAccountEmail:
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ??
    process.env.GOOGLE_BOOKINGS_SERVICE_ACCOUNT_EMAIL?.trim() ??
    "",
  serviceAccountPrivateKey:
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ?? "",
} as const;

export const isPersonalGoogleTasksOAuthConfigured = (): boolean =>
  Boolean(
    serverGoogleTasksConfig.oauthClientId &&
      serverGoogleTasksConfig.oauthClientSecret
  );

export const isPersonalGoogleTasksSync = (): boolean =>
  serverGoogleTasksConfig.enabled &&
  serverGoogleTasksConfig.syncMode === "personal" &&
  isPersonalGoogleTasksOAuthConfigured();

export const isLegacyGoogleTasksSync = (): boolean =>
  serverGoogleTasksConfig.enabled &&
  serverGoogleTasksConfig.syncMode === "legacy" &&
  isGoogleTasksConfigured();

export const isGoogleTasksConfigured = (): boolean => {
  switch (serverGoogleTasksConfig.authMode) {
    case "adc":
    case "impersonate":
    case "delegated":
    case "wif":
      return true;
    case "oauth":
      return Boolean(
        serverGoogleTasksConfig.oauthClientId &&
          serverGoogleTasksConfig.oauthClientSecret &&
          serverGoogleTasksConfig.oauthRefreshToken
      );
    default: {
      const {
        delegatedUser,
        serviceAccountEmail,
        serviceAccountPrivateKey,
        serviceAccountJson,
      } = serverGoogleTasksConfig;
      const hasKey = Boolean(serviceAccountPrivateKey || serviceAccountJson);
      return Boolean(delegatedUser && serviceAccountEmail && hasKey);
    }
  }
};

export const isGoogleTasksActive = (): boolean =>
  isPersonalGoogleTasksSync() || isLegacyGoogleTasksSync();
