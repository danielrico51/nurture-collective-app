import type { AwsSecurityCredentialsSupplier } from "google-auth-library";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";

export const resolveAwsRegion = (): string =>
  process.env.AWS_REGION?.trim() ||
  process.env.AWS_DEFAULT_REGION?.trim() ||
  process.env.AMPLIFY_AWS_REGION?.trim() ||
  "us-east-1";

/** Supplies Amplify/Lambda AWS credentials to google-auth-library AwsClient (no EC2 IMDS). */
export const buildAwsSecurityCredentialsSupplier =
  (): AwsSecurityCredentialsSupplier => ({
    getAwsRegion: async () => resolveAwsRegion(),
    getAwsSecurityCredentials: async () => {
      const creds = await getServerCredentials()();

      if (!creds.accessKeyId || !creds.secretAccessKey) {
        throw new Error(
          "AWS credentials are not available for Google Workload Identity Federation."
        );
      }

      return {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        token: creds.sessionToken,
      };
    },
  });
