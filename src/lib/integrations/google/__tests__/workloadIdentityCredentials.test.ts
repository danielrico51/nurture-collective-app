import { describe, expect, it } from "vitest";
import { buildWorkloadIdentityCredentials } from "@/lib/integrations/google/workloadIdentityCredentials";
import {
  buildAwsSecurityCredentialsSupplier,
  resolveAwsRegion,
} from "@/lib/integrations/google/awsSecurityCredentialsSupplier";

describe("buildWorkloadIdentityCredentials", () => {
  const config = {
    projectNumber: "643818957131",
    poolId: "nurture-amplify-aws",
    providerId: "aws-amplify",
    serviceAccountEmail:
      "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com",
  };

  it("builds external_account config for AWS WIF", () => {
    const creds = buildWorkloadIdentityCredentials(config);

    expect(creds.type).toBe("external_account");
    expect(creds.audience).toBe(
      "//iam.googleapis.com/projects/643818957131/locations/global/workloadIdentityPools/nurture-amplify-aws/providers/aws-amplify"
    );
    expect(creds.service_account_impersonation_url).toContain(
      encodeURIComponent(
        "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com"
      )
    );
    expect(creds.credential_source).toBeUndefined();
  });

  it("omits impersonation URL when signJwt uses federated principal token", () => {
    const creds = buildWorkloadIdentityCredentials(config, {
      impersonateServiceAccount: false,
    });

    expect(creds.service_account_impersonation_url).toBeUndefined();
  });
});

describe("buildAwsSecurityCredentialsSupplier", () => {
  it("reads AWS region from env with us-east-1 fallback", () => {
    const previous = process.env.AWS_REGION;
    process.env.AWS_REGION = "us-west-2";
    expect(resolveAwsRegion()).toBe("us-west-2");
    process.env.AWS_REGION = previous;
  });

  it("returns credentials from env when present", async () => {
    const previous = {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
    };

    process.env.AWS_ACCESS_KEY_ID = "AKIATEST";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    process.env.AWS_SESSION_TOKEN = "token";

    const supplier = buildAwsSecurityCredentialsSupplier();
    await expect(supplier.getAwsSecurityCredentials({} as never)).resolves.toEqual({
      accessKeyId: "AKIATEST",
      secretAccessKey: "secret",
      token: "token",
    });

    process.env.AWS_ACCESS_KEY_ID = previous.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = previous.AWS_SECRET_ACCESS_KEY;
    process.env.AWS_SESSION_TOKEN = previous.AWS_SESSION_TOKEN;
  });
});
