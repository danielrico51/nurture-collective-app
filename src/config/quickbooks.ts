export type QuickBooksEnvironment = "sandbox" | "production";

export type BillingSyncMode = "n8n" | "direct" | "hybrid";

const readEnvironment = (): QuickBooksEnvironment => {
  const value = process.env.QBO_ENVIRONMENT?.trim().toLowerCase();
  return value === "production" ? "production" : "sandbox";
};

const readSyncMode = (): BillingSyncMode => {
  const value = process.env.BILLING_SYNC_MODE?.trim().toLowerCase();
  if (value === "direct" || value === "hybrid") return value;
  return "n8n";
};

const readItemId = (key: string): string => process.env[key]?.trim() ?? "";

/** Server-only QuickBooks Online + billing configuration. */
export const serverQuickBooksConfig = {
  environment: readEnvironment(),
  clientId: process.env.QBO_CLIENT_ID?.trim() ?? "",
  clientSecret: process.env.QBO_CLIENT_SECRET?.trim() ?? "",
  realmId: process.env.QBO_REALM_ID?.trim() ?? "",
  refreshToken: process.env.QBO_REFRESH_TOKEN?.trim() ?? "",
  webhookVerifier: process.env.QBO_WEBHOOK_VERIFIER?.trim() ?? "",
  /** @deprecated Prefer category-specific itemIds below. */
  defaultItemId: readItemId("QBO_DEFAULT_ITEM_ID"),
  defaultIncomeAccountId: readItemId("QBO_DEFAULT_INCOME_ACCOUNT_ID"),
  /** QBO service items — each item maps to an income account in QuickBooks. */
  itemIds: {
    birth_services: readItemId("QBO_BIRTH_SERVICES_ITEM_ID"),
    postpartum_support: readItemId("QBO_POSTPARTUM_SUPPORT_ITEM_ID"),
    other_operation_income: readItemId("QBO_OTHER_OPERATION_INCOME_ITEM_ID"),
    deposit: readItemId("QBO_DEPOSIT_ITEM_ID"),
  },
  redirectUri: process.env.QBO_REDIRECT_URI?.trim() ?? "",
  syncMode: readSyncMode(),
  billingWebhookUrl: process.env.N8N_BILLING_WEBHOOK_URL?.trim() ?? "",
  billingWebhookSecret:
    process.env.N8N_BILLING_WEBHOOK_SECRET?.trim() ??
    process.env.N8N_WEBHOOK_SECRET?.trim() ??
    "",
  tokenStorageKey:
    process.env.QBO_TOKEN_S3_KEY?.trim() ??
    "management/integrations/quickbooks/oauth.json",
} as const;

/** Client credentials present (OAuth app configured). */
export const isQuickBooksOAuthConfigured = (): boolean =>
  Boolean(
    serverQuickBooksConfig.clientId &&
      serverQuickBooksConfig.clientSecret &&
      resolveQuickBooksRedirectUri()
  );

/** @deprecated Use isQuickBooksOAuthConfigured — realm ID lives in stored OAuth tokens, not env. */
export const isQuickBooksConfigured = isQuickBooksOAuthConfigured;

export const getQuickBooksApiBaseUrl = (): string =>
  serverQuickBooksConfig.environment === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";

export const getQuickBooksOAuthBaseUrl = (): string =>
  "https://appcenter.intuit.com/connect/oauth2";

export const getQuickBooksTokenUrl = (): string =>
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

const isLocalhostUrl = (value: string): boolean =>
  /localhost|127\.0\.0\.1/i.test(value);

/** OAuth callback URL — never use localhost on deployed Amplify unless explicitly local. */
export const resolveQuickBooksRedirectUri = (): string => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const derivedFromApp = appUrl
    ? `${appUrl}/api/integrations/quickbooks/oauth/callback`
    : "";

  const explicit = serverQuickBooksConfig.redirectUri.trim();

  if (explicit && !isLocalhostUrl(explicit)) {
    return explicit;
  }

  if (derivedFromApp && !isLocalhostUrl(derivedFromApp)) {
    return derivedFromApp;
  }

  return explicit || derivedFromApp;
};

/** Site origin for post-OAuth redirects (never localhost on deployed hosts). */
export const getQuickBooksSiteOrigin = (): string => {
  const redirect = resolveQuickBooksRedirectUri();
  if (redirect) {
    try {
      return new URL(redirect).origin;
    } catch {
      /* fall through */
    }
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && !isLocalhostUrl(appUrl)) {
    return appUrl.replace(/\/$/, "");
  }
  return "";
};
