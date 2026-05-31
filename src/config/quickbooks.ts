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

/** Server-only QuickBooks Online + billing configuration. */
export const serverQuickBooksConfig = {
  environment: readEnvironment(),
  clientId: process.env.QBO_CLIENT_ID?.trim() ?? "",
  clientSecret: process.env.QBO_CLIENT_SECRET?.trim() ?? "",
  realmId: process.env.QBO_REALM_ID?.trim() ?? "",
  refreshToken: process.env.QBO_REFRESH_TOKEN?.trim() ?? "",
  webhookVerifier: process.env.QBO_WEBHOOK_VERIFIER?.trim() ?? "",
  defaultItemId: process.env.QBO_DEFAULT_ITEM_ID?.trim() ?? "",
  defaultIncomeAccountId: process.env.QBO_DEFAULT_INCOME_ACCOUNT_ID?.trim() ?? "",
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

export const isQuickBooksConfigured = (): boolean =>
  Boolean(
    serverQuickBooksConfig.clientId &&
      serverQuickBooksConfig.clientSecret &&
      serverQuickBooksConfig.realmId
  );

export const isQuickBooksOAuthConfigured = (): boolean =>
  Boolean(
    serverQuickBooksConfig.clientId &&
      serverQuickBooksConfig.clientSecret &&
      serverQuickBooksConfig.redirectUri
  );

export const getQuickBooksApiBaseUrl = (): string =>
  serverQuickBooksConfig.environment === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";

export const getQuickBooksOAuthBaseUrl = (): string =>
  "https://appcenter.intuit.com/connect/oauth2";

export const getQuickBooksTokenUrl = (): string =>
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
