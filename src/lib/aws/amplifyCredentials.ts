import type { AwsCredentialIdentityProvider } from "@aws-sdk/types";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

const readServerAccessKeyId = () =>
  process.env.SERVER_AWS_ACCESS_KEY_ID?.trim() ||
  process.env.AMPLIFY_AWS_ACCESS_KEY_ID?.trim() ||
  "";

const readServerSecretAccessKey = () =>
  process.env.SERVER_AWS_SECRET_ACCESS_KEY?.trim() ||
  process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY?.trim() ||
  "";

export const getServerCredentialHint = () => ({
  hasServerAccessKey: Boolean(readServerAccessKeyId()),
  hasServerSecretKey: Boolean(readServerSecretAccessKey()),
  hasRuntimeAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
  hasRuntimeSessionToken: Boolean(process.env.AWS_SESSION_TOKEN),
});

export const getServerCredentials = (): AwsCredentialIdentityProvider => {
  const accessKeyId = readServerAccessKeyId();
  const secretAccessKey = readServerSecretAccessKey();

  if (accessKeyId && secretAccessKey) {
    return async () => ({ accessKeyId, secretAccessKey });
  }

  return defaultProvider();
};

export const hasExplicitServerCredentials = () =>
  Boolean(readServerAccessKeyId() && readServerSecretAccessKey());
