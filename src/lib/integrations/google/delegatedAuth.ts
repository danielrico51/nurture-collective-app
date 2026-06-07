import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { serverGoogleTasksConfig } from "@/config/googleTasks";

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

export interface DelegatedGoogleAuthOptions {
  scope: string;
  subject?: string;
  serviceAccount?: string;
  adcJson?: string;
}

/**
 * Domain-wide delegation via IAM signJwt (no JSON keys).
 * Requires Workspace Admin to authorize the service account client ID.
 */
export const createDelegatedGoogleAuthClient = async (
  options: DelegatedGoogleAuthOptions
): Promise<OAuth2Client> => {
  const subject =
    options.subject ||
    serverGoogleTasksConfig.delegatedUser ||
    "admin@nesting-place.com";
  const serviceAccount =
    options.serviceAccount || serverGoogleTasksConfig.impersonateServiceAccount;
  const adcJson = options.adcJson || serverGoogleTasksConfig.adcJson;
  const now = Math.floor(Date.now() / 1000);

  const payload = JSON.stringify({
    iss: serviceAccount,
    sub: subject,
    scope: options.scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });

  const sourceAuth = adcJson
    ? new GoogleAuth({
        credentials: JSON.parse(adcJson) as Record<string, unknown>,
        scopes: [CLOUD_PLATFORM_SCOPE],
      })
    : new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });
  const sourceClient = await sourceAuth.getClient();

  const signUrl = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccount)}:signJwt`;

  const signResponse = await sourceClient.request<{ signedJwt: string }>({
    url: signUrl,
    method: "POST",
    data: { payload },
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signResponse.data.signedJwt,
    }),
  });

  const tokens = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokens.access_token) {
    throw new Error(
      tokens.error_description ||
        tokens.error ||
        `Domain-wide delegation failed. Add the service account client ID in Google Workspace Admin → Security → API controls → Domain-wide delegation. Scope: ${options.scope}`
    );
  }

  const client = new OAuth2Client();
  client.setCredentials({
    access_token: tokens.access_token,
    token_type: tokens.token_type,
    expiry_date: Date.now() + (tokens.expires_in ?? 3600) * 1000,
  });

  return client;
};

/** @deprecated Use createDelegatedGoogleAuthClient({ scope: TASKS_SCOPE }) */
export const createDelegatedUserOAuthClient = async (): Promise<OAuth2Client> =>
  createDelegatedGoogleAuthClient({
    scope: "https://www.googleapis.com/auth/tasks",
  });
