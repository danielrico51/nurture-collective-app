export type SocialAuthProvider = "Google" | "Facebook" | "Apple";

const parseEnabled = (value: string | undefined): boolean =>
  value === "true" || value === "1";

const trim = (value: string | undefined): string => value?.trim() ?? "";

/** Known pool → Hosted UI domain (fallback when domain env is unset). */
const COGNITO_DOMAIN_BY_POOL_ID: Record<string, string> = {
  "us-east-1_rUfTimytf": "us-east-1ruftimytf.auth.us-east-1.amazoncognito.com",
};

/** Cognito Hosted UI domain, e.g. us-east-1ruftimytf.auth.us-east-1.amazoncognito.com */
export const getCognitoOAuthDomain = (): string | undefined => {
  const domain = trim(process.env.NEXT_PUBLIC_COGNITO_DOMAIN);
  if (domain) return domain;
  const poolId = trim(process.env.NEXT_PUBLIC_USER_POOL_ID);
  if (poolId && COGNITO_DOMAIN_BY_POOL_ID[poolId]) {
    return COGNITO_DOMAIN_BY_POOL_ID[poolId];
  }
  return undefined;
};

export const getAppBaseUrl = (): string => {
  const fromEnv = trim(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
};

export const getOAuthCallbackUrl = (): string =>
  `${getAppBaseUrl()}/oauth/callback`;

export const getOAuthSignOutUrl = (): string => `${getAppBaseUrl()}/`;

export const isSocialAuthEnabled = (): boolean =>
  parseEnabled(process.env.NEXT_PUBLIC_SOCIAL_AUTH_ENABLED) &&
  Boolean(getCognitoOAuthDomain());

export const getEnabledSocialProviders = (): SocialAuthProvider[] => {
  if (!isSocialAuthEnabled()) return [];

  const providers: SocialAuthProvider[] = [];
  if (parseEnabled(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED)) {
    providers.push("Google");
  }
  if (parseEnabled(process.env.NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED)) {
    providers.push("Facebook");
  }
  if (parseEnabled(process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED)) {
    providers.push("Apple");
  }

  // Global flag on but no per-provider flags — show Google at minimum
  if (providers.length === 0 && parseEnabled(process.env.NEXT_PUBLIC_SOCIAL_AUTH_ENABLED)) {
    providers.push("Google");
  }

  return providers;
};

export const AUTH_RETURN_TO_KEY = "nurture.auth.returnTo";

export const storeAuthReturnTo = (returnTo: string | null | undefined): void => {
  if (typeof window === "undefined" || !returnTo) return;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return;
  sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
};

export const readAuthReturnTo = (): string | null => {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  if (value) sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  return value;
};
