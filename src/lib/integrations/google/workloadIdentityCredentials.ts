import type { GoogleWorkloadIdentityConfig } from "@/config/googleWorkloadIdentity";

/** external_account JSON for google-auth-library (AWS → Google SA impersonation). */
export const buildWorkloadIdentityCredentials = (
  config: GoogleWorkloadIdentityConfig
): Record<string, unknown> => ({
  type: "external_account",
  audience: `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/providers/${config.providerId}`,
  subject_token_type: "urn:ietf:params:aws:token-type:aws4_request",
  token_url: "https://sts.googleapis.com/v1/token",
  service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.serviceAccountEmail)}:generateAccessToken`,
  credential_source: {
    environment_id: "aws1",
    regional_cred_verification_url:
      "https://sts.{region}.amazonaws.com?Action=GetCallerIdentity&Version=2011-06-15",
  },
});
