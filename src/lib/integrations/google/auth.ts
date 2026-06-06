import {
  GoogleAuth,
  Impersonated,
  JWT,
  type AuthClient,
} from "google-auth-library";
import {
  isGoogleTasksConfigured,
  serverGoogleTasksConfig,
} from "@/config/googleTasks";
import { createDelegatedUserOAuthClient } from "@/lib/integrations/google/delegatedAuth";
import { createOAuthUserClient } from "@/lib/integrations/google/oauthUserAuth";

const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

const readServiceAccountCredentials = (): {
  client_email: string;
  private_key: string;
} => {
  const { serviceAccountJson, serviceAccountEmail, serviceAccountPrivateKey } =
    serverGoogleTasksConfig;

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing email or key");
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    };
  }

  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    throw new Error("Google service account credentials are not configured");
  }

  return {
    client_email: serviceAccountEmail,
    private_key: serviceAccountPrivateKey,
  };
};

const createUserAdcClient = async (): Promise<AuthClient> => {
  const auth = new GoogleAuth({ scopes: [TASKS_SCOPE] });
  return auth.getClient();
};

const createImpersonatedClient = async (): Promise<AuthClient> => {
  const sourceAuth = new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });
  const sourceClient = await sourceAuth.getClient();

  return new Impersonated({
    sourceClient,
    targetPrincipal: serverGoogleTasksConfig.impersonateServiceAccount,
    targetScopes: [TASKS_SCOPE],
    lifetime: 3600,
  });
};

export const createGoogleTasksAuthClient = async (): Promise<AuthClient> => {
  if (!isGoogleTasksConfigured()) {
    throw new Error("Google Tasks is not configured");
  }

  switch (serverGoogleTasksConfig.authMode) {
    case "oauth":
      return createOAuthUserClient();
    case "delegated":
      return createDelegatedUserOAuthClient();
    case "adc":
      return createUserAdcClient();
    case "impersonate":
      return createImpersonatedClient();
    default: {
      const credentials = readServiceAccountCredentials();
      return new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [TASKS_SCOPE],
        subject: serverGoogleTasksConfig.delegatedUser,
      });
    }
  }
};
