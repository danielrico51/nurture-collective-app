import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { serverGoogleTasksConfig } from "@/config/googleTasks";

const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

/**
 * Domain-wide delegation via IAM signJwt (no JSON keys).
 * Requires Workspace Admin to authorize the service account client ID.
 */
export const createDelegatedUserOAuthClient = async (): Promise<OAuth2Client> => {
  const subject =
    serverGoogleTasksConfig.delegatedUser || "admin@nesting-place.com";
  const serviceAccount = serverGoogleTasksConfig.impersonateServiceAccount;
  const now = Math.floor(Date.now() / 1000);

  const payload = JSON.stringify({
    iss: serviceAccount,
    sub: subject,
    scope: TASKS_SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });

  const sourceAuth = serverGoogleTasksConfig.adcJson
    ? new GoogleAuth({
        credentials: JSON.parse(serverGoogleTasksConfig.adcJson) as Record<
          string,
          unknown
        >,
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
        "Domain-wide delegation failed. Add the service account client ID in Google Workspace Admin → Security → API controls → Domain-wide delegation. Scope: https://www.googleapis.com/auth/tasks"
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
