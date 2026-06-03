import {
  getQuickBooksOAuthBaseUrl,
  getQuickBooksTokenUrl,
  resolveQuickBooksRedirectUri,
  serverQuickBooksConfig,
} from "@/config/quickbooks";
import {
  buildTokenSetFromOAuthResponse,
  getEnvFallbackTokens,
  readQuickBooksTokens,
  writeQuickBooksTokens,
} from "@/lib/integrations/quickbooks/tokenStorage";
import type { QuickBooksTokenSet } from "@/lib/integrations/quickbooks/types";

const QBO_SCOPES = [
  "com.intuit.quickbooks.accounting",
  "openid",
  "profile",
  "email",
].join(" ");

interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  x_refresh_token_expires_in?: number;
}

const parseTokenResponse = (
  data: OAuthTokenResponse,
  realmId: string
): QuickBooksTokenSet =>
  buildTokenSetFromOAuthResponse({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresInSeconds: data.expires_in,
    realmId,
  });

const requestTokens = async (
  body: URLSearchParams
): Promise<OAuthTokenResponse> => {
  const credentials = Buffer.from(
    `${serverQuickBooksConfig.clientId}:${serverQuickBooksConfig.clientSecret}`
  ).toString("base64");

  const response = await fetch(getQuickBooksTokenUrl(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as OAuthTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error_description ?? data.error ?? `QuickBooks OAuth failed (${response.status})`
    );
  }

  return data;
};

export const buildQuickBooksAuthorizeUrl = (state: string): string => {
  const redirectUri = resolveQuickBooksRedirectUri();
  const params = new URLSearchParams({
    client_id: serverQuickBooksConfig.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: QBO_SCOPES,
    state,
  });
  return `${getQuickBooksOAuthBaseUrl()}?${params.toString()}`;
};

export const exchangeQuickBooksAuthCode = async (
  code: string,
  realmId: string
): Promise<QuickBooksTokenSet> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: resolveQuickBooksRedirectUri(),
  });

  const data = await requestTokens(body);
  const tokens = parseTokenResponse(data, realmId);
  await writeQuickBooksTokens(tokens);
  return tokens;
};

export const refreshQuickBooksAccessToken = async (
  refreshToken: string,
  realmId: string
): Promise<QuickBooksTokenSet> => {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const data = await requestTokens(body);
  const tokens = parseTokenResponse(data, realmId);
  await writeQuickBooksTokens(tokens);
  return tokens;
};

const isTokenExpired = (tokens: QuickBooksTokenSet): boolean => {
  const expiresAt = new Date(tokens.expiresAt).getTime();
  // Refresh 5 minutes before expiry.
  return Date.now() >= expiresAt - 5 * 60 * 1000;
};

/** Resolve a valid access token, refreshing and persisting when needed. */
export const getValidQuickBooksTokens = async (): Promise<QuickBooksTokenSet> => {
  const stored = (await readQuickBooksTokens()) ?? getEnvFallbackTokens();
  if (!stored?.refreshToken) {
    throw new Error(
      "QuickBooks is not connected. Complete OAuth at /api/integrations/quickbooks/oauth/authorize"
    );
  }

  if (stored.accessToken && !isTokenExpired(stored)) {
    return stored;
  }

  return refreshQuickBooksAccessToken(stored.refreshToken, stored.realmId);
};
