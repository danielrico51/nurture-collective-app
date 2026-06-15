import {
  GoogleAuth,
  Impersonated,
  JWT,
  type AuthClient,
} from "google-auth-library";
import { createDelegatedGoogleAuthClient } from "@/lib/integrations/google/delegatedAuth";
import { serverGoogleTasksConfig } from "@/config/googleTasks";
import {
  isGoogleSchedulingConfigured,
  serverSchedulingConfig,
} from "@/lib/scheduling/config";

export const GOOGLE_DOCS_SCOPE = "https://www.googleapis.com/auth/documents";
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

/** Scopes required for proposal template copy + placeholder replacement. */
export const GOOGLE_PROPOSAL_DOCS_SCOPES = [GOOGLE_DOCS_SCOPE, GOOGLE_DRIVE_SCOPE] as const;

export const GOOGLE_PROPOSAL_DOCS_SCOPE_STRING =
  GOOGLE_PROPOSAL_DOCS_SCOPES.join(" ");

const readServiceAccountCredentials = (): {
  client_email: string;
  private_key: string;
} => {
  const json = serverSchedulingConfig.serviceAccountJson;
  const email = serverSchedulingConfig.serviceAccountEmail;
  const key = serverSchedulingConfig.serviceAccountPrivateKey;

  if (json) {
    const parsed = JSON.parse(json) as {
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

  if (!email || !key) {
    throw new Error("Google service account credentials are not configured");
  }

  return { client_email: email, private_key: key };
};

export const createGoogleProposalDocsAuthClient = async (): Promise<AuthClient> => {
  if (!isGoogleSchedulingConfigured()) {
    throw new Error(
      "Google delegated auth is not configured (same prerequisites as Calendar/Tasks)"
    );
  }

  switch (serverSchedulingConfig.authMode) {
    case "delegated":
    case "wif":
      return createDelegatedGoogleAuthClient({
        scope: GOOGLE_PROPOSAL_DOCS_SCOPE_STRING,
        subject: serverSchedulingConfig.delegatedUser,
        serviceAccount: serverSchedulingConfig.impersonateServiceAccount,
        adcJson: serverSchedulingConfig.adcJson,
      });
    case "adc": {
      const auth = new GoogleAuth({ scopes: [...GOOGLE_PROPOSAL_DOCS_SCOPES] });
      return auth.getClient();
    }
    case "impersonate": {
      const sourceAuth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      const sourceClient = await sourceAuth.getClient();
      return new Impersonated({
        sourceClient,
        targetPrincipal: serverSchedulingConfig.impersonateServiceAccount,
        targetScopes: [...GOOGLE_PROPOSAL_DOCS_SCOPES],
        lifetime: 3600,
      });
    }
    default: {
      const credentials = readServiceAccountCredentials();
      return new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [...GOOGLE_PROPOSAL_DOCS_SCOPES],
        subject: serverSchedulingConfig.delegatedUser || undefined,
      });
    }
  }
};
