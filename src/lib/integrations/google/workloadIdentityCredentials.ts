import { AwsClient } from "google-auth-library";
import type { GoogleWorkloadIdentityConfig } from "@/config/googleWorkloadIdentity";
import { buildAwsSecurityCredentialsSupplier } from "@/lib/integrations/google/awsSecurityCredentialsSupplier";

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

export type WorkloadIdentityAwsClientOptions = {
  /**
   * When false, returns the federated AWS principal token (for IAM signJwt).
   * When true, exchanges for an impersonated service account access token.
   */
  impersonateServiceAccount?: boolean;
};

const buildAudience = (config: GoogleWorkloadIdentityConfig): string =>
  `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/providers/${config.providerId}`;

const buildServiceAccountImpersonationUrl = (
  config: GoogleWorkloadIdentityConfig
): string =>
  `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.serviceAccountEmail)}:generateAccessToken`;

/** AwsClient for AWS → Google on Amplify (uses runtime AWS creds, not IMDS). */
export const createWorkloadIdentityAwsClient = (
  config: GoogleWorkloadIdentityConfig,
  options: WorkloadIdentityAwsClientOptions = {}
): AwsClient => {
  const impersonate = options.impersonateServiceAccount !== false;
  const clientOptions: ConstructorParameters<typeof AwsClient>[0] = {
    audience: buildAudience(config),
    subject_token_type: "urn:ietf:params:aws:token-type:aws4_request",
    token_url: "https://sts.googleapis.com/v1/token",
    aws_security_credentials_supplier: buildAwsSecurityCredentialsSupplier(),
    scopes: [CLOUD_PLATFORM_SCOPE],
  };

  if (impersonate) {
    clientOptions.service_account_impersonation_url =
      buildServiceAccountImpersonationUrl(config);
  }

  return new AwsClient(clientOptions);
};

/** external_account JSON shape (reference / local tooling; runtime uses createWorkloadIdentityAwsClient). */
export const buildWorkloadIdentityCredentials = (
  config: GoogleWorkloadIdentityConfig,
  options: WorkloadIdentityAwsClientOptions = {}
): Record<string, unknown> => {
  const creds: Record<string, unknown> = {
    type: "external_account",
    audience: buildAudience(config),
    subject_token_type: "urn:ietf:params:aws:token-type:aws4_request",
    token_url: "https://sts.googleapis.com/v1/token",
  };

  if (options.impersonateServiceAccount !== false) {
    creds.service_account_impersonation_url =
      buildServiceAccountImpersonationUrl(config);
  }

  return creds;
};
