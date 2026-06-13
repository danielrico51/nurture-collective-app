import { AwsClient } from "google-auth-library";
import type { GoogleWorkloadIdentityConfig } from "@/config/googleWorkloadIdentity";
import { buildAwsSecurityCredentialsSupplier } from "@/lib/integrations/google/awsSecurityCredentialsSupplier";

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

const buildAudience = (config: GoogleWorkloadIdentityConfig): string =>
  `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/providers/${config.providerId}`;

const buildServiceAccountImpersonationUrl = (
  config: GoogleWorkloadIdentityConfig
): string =>
  `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.serviceAccountEmail)}:generateAccessToken`;

/** AwsClient for AWS → Google SA impersonation on Amplify (uses runtime AWS creds, not IMDS). */
export const createWorkloadIdentityAwsClient = (
  config: GoogleWorkloadIdentityConfig
): AwsClient =>
  new AwsClient({
    audience: buildAudience(config),
    subject_token_type: "urn:ietf:params:aws:token-type:aws4_request",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: buildServiceAccountImpersonationUrl(config),
    aws_security_credentials_supplier: buildAwsSecurityCredentialsSupplier(),
    scopes: [CLOUD_PLATFORM_SCOPE],
  });

/** external_account JSON shape (reference / local tooling; runtime uses createWorkloadIdentityAwsClient). */
export const buildWorkloadIdentityCredentials = (
  config: GoogleWorkloadIdentityConfig
): Record<string, unknown> => ({
  type: "external_account",
  audience: buildAudience(config),
  subject_token_type: "urn:ietf:params:aws:token-type:aws4_request",
  token_url: "https://sts.googleapis.com/v1/token",
  service_account_impersonation_url: buildServiceAccountImpersonationUrl(config),
});
