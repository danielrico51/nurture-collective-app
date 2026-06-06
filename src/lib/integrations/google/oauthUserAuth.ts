import { OAuth2Client } from "google-auth-library";
import { serverGoogleTasksConfig } from "@/config/googleTasks";

const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
const DEFAULT_REDIRECT_URI = "http://localhost:3333/oauth2callback";

export const createOAuthUserClient = (): OAuth2Client => {
  const { oauthClientId, oauthClientSecret, oauthRefreshToken } =
    serverGoogleTasksConfig;

  if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
    throw new Error(
      "OAuth not configured. Run: npm run google-tasks:oauth-setup"
    );
  }

  const client = new OAuth2Client(
    oauthClientId,
    oauthClientSecret,
    serverGoogleTasksConfig.oauthRedirectUri || DEFAULT_REDIRECT_URI
  );
  client.setCredentials({ refresh_token: oauthRefreshToken });
  return client;
};

export const getOAuthConsentUrl = (): string => {
  const client = new OAuth2Client(
    serverGoogleTasksConfig.oauthClientId,
    serverGoogleTasksConfig.oauthClientSecret,
    serverGoogleTasksConfig.oauthRedirectUri || DEFAULT_REDIRECT_URI
  );

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [TASKS_SCOPE],
  });
};
