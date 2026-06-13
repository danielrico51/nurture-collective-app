import { describe, expect, it } from "vitest";
import { buildWorkloadIdentityCredentials } from "@/lib/integrations/google/workloadIdentityCredentials";

describe("buildWorkloadIdentityCredentials", () => {
  it("builds external_account config for AWS WIF", () => {
    const creds = buildWorkloadIdentityCredentials({
      projectNumber: "643818957131",
      poolId: "nurture-amplify-aws",
      providerId: "aws-amplify",
      serviceAccountEmail:
        "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com",
    });

    expect(creds.type).toBe("external_account");
    expect(creds.audience).toBe(
      "//iam.googleapis.com/projects/643818957131/locations/global/workloadIdentityPools/nurture-amplify-aws/providers/aws-amplify"
    );
    expect(creds.service_account_impersonation_url).toContain(
      encodeURIComponent(
        "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com"
      )
    );
    expect(creds.credential_source).toEqual({
      environment_id: "aws1",
      regional_cred_verification_url:
        "https://sts.{region}.amazonaws.com?Action=GetCallerIdentity&Version=2011-06-15",
    });
  });
});
