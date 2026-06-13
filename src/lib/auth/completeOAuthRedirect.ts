import {
  getCognitoOAuthDomain,
  getOAuthCallbackUrl,
} from "@/config/socialAuth";
import { configureAmplify } from "@/utils/amplifyConfig";
import { decodeJWT, fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

const AUTH_KEY_PREFIX = "CognitoIdentityServiceProvider";
const OAUTH_PKCE_KEY = "oauthPKCE";
const OAUTH_STATE_KEY = "oauthState";
const OAUTH_INFLIGHT_KEY = "inflightOAuth";
const OAUTH_SIGN_IN_KEY = "oauthSignIn";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getClientId = () => {
  const clientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("Missing NEXT_PUBLIC_USER_POOL_CLIENT_ID");
  }
  return clientId;
};

const oauthStorageKey = (clientId: string, suffix: string) =>
  `${AUTH_KEY_PREFIX}.${clientId}.${suffix}`;

const tokenStorageKey = (
  clientId: string,
  username: string,
  suffix: string
) => `${AUTH_KEY_PREFIX}.${clientId}.${username}.${suffix}`;

const resolveRedirectUri = (): string => {
  const callbackUrl = getOAuthCallbackUrl();
  const candidates = Array.from(
    new Set([
      callbackUrl,
      callbackUrl.replace("://www.", "://"),
      callbackUrl.replace("://", "://www."),
    ])
  );

  const origin = window.location.origin;
  const pathname = window.location.pathname || "/";
  const exact = candidates.find((url) => url.startsWith(`${origin}${pathname}`));
  if (exact) return exact;

  const hostnameMatch = candidates.find((url) =>
    url.includes(window.location.hostname)
  );
  if (hostnameMatch) return hostnameMatch;

  return callbackUrl;
};

const readOAuthValue = (clientId: string, key: string) =>
  window.localStorage.getItem(oauthStorageKey(clientId, key)) ??
  window.sessionStorage.getItem(oauthStorageKey(clientId, key));

const clearOAuthTransientState = (clientId: string) => {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(oauthStorageKey(clientId, OAUTH_INFLIGHT_KEY));
    storage.removeItem(oauthStorageKey(clientId, OAUTH_PKCE_KEY));
    storage.removeItem(oauthStorageKey(clientId, OAUTH_STATE_KEY));
  }
};

const storeCognitoTokens = ({
  clientId,
  username,
  accessToken,
  idToken,
  refreshToken,
}: {
  clientId: string;
  username: string;
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
}) => {
  const decoded = decodeJWT(accessToken);
  const issuedAtMs = (decoded.payload.iat ?? 0) * 1000;
  const clockDrift =
    issuedAtMs > 0 ? issuedAtMs - Date.now() : 0;

  window.localStorage.setItem(
    `${AUTH_KEY_PREFIX}.${clientId}.LastAuthUser`,
    username
  );
  window.localStorage.setItem(
    tokenStorageKey(clientId, username, "accessToken"),
    accessToken
  );
  window.localStorage.setItem(
    tokenStorageKey(clientId, username, "clockDrift"),
    String(clockDrift)
  );

  if (idToken) {
    window.localStorage.setItem(
      tokenStorageKey(clientId, username, "idToken"),
      idToken
    );
  }

  if (refreshToken) {
    window.localStorage.setItem(
      tokenStorageKey(clientId, username, "refreshToken"),
      refreshToken
    );
  }

  window.localStorage.setItem(
    oauthStorageKey(clientId, OAUTH_SIGN_IN_KEY),
    "true,false"
  );
};

const exchangeAuthorizationCode = async (code: string, state: string) => {
  const clientId = getClientId();
  const domain = getCognitoOAuthDomain();
  if (!domain) {
    throw new Error("Missing Cognito OAuth domain");
  }

  const savedState = readOAuthValue(clientId, OAUTH_STATE_KEY);
  const codeVerifier = readOAuthValue(clientId, OAUTH_PKCE_KEY);

  if (!savedState || savedState !== state) {
    throw new Error("OAuth state mismatch. Please start Google sign-in again.");
  }

  if (!codeVerifier) {
    throw new Error(
      "OAuth session expired before callback. Please start Google sign-in again."
    );
  }

  const redirectUri = resolveRedirectUri();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json()) as {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        `OAuth token exchange failed (${response.status})`
    );
  }

  if (!payload.access_token) {
    throw new Error("OAuth token exchange returned no access token");
  }

  const username =
    decodeJWT(payload.access_token).payload.username?.toString() || "username";

  storeCognitoTokens({
    clientId,
    username,
    accessToken: payload.access_token,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
  });

  clearOAuthTransientState(clientId);
  window.history.replaceState(window.history.state, "", redirectUri);
};

/** Complete Cognito OAuth redirect and establish an Amplify session. */
export const waitForOAuthCallbackCompletion = async (
  maxWaitMs = 20000
): Promise<void> => {
  configureAmplify();

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) {
    throw new Error("Missing OAuth callback parameters");
  }

  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    try {
      await fetchAuthSession();
      await getCurrentUser();
      return;
    } catch {
      /* Amplify may still be exchanging the code */
    }
    await sleep(250);
  }

  await exchangeAuthorizationCode(code, state);
  await fetchAuthSession({ forceRefresh: true });
  await getCurrentUser();
};
