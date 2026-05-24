import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

export const getCognitoRegion = () =>
  process.env.AWS_REGION ??
  process.env.NEXT_PUBLIC_AWS_REGION ??
  "us-east-1";

export const getCognitoClient = () =>
  new CognitoIdentityProviderClient({
    region: getCognitoRegion(),
    credentials: defaultProvider(),
  });

export const getRuntimeCredentialHint = () => ({
  hasAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
  hasSessionToken: Boolean(process.env.AWS_SESSION_TOKEN),
  region: getCognitoRegion(),
  poolId: process.env.NEXT_PUBLIC_USER_POOL_ID?.trim() ?? "",
});

export const formatCognitoListError = (error: unknown) => {
  const err = error as { name?: string; message?: string };
  const name = err.name ?? "UnknownError";
  const detail = err.message ?? "Failed to load team members from Cognito";
  const hint = getRuntimeCredentialHint();

  if (
    name === "CredentialsProviderError" ||
    /could not load credentials|Unable to locate credentials/i.test(detail)
  ) {
    return {
      name,
      detail,
      userMessage:
        "Showing your account only. Amplify SSR compute credentials were not available. Confirm the compute role is set on the main branch and redeploy.",
      hint,
    };
  }

  if (
    name === "AccessDeniedException" ||
    name === "UnauthorizedException" ||
    name === "NotAuthorizedException" ||
    /not authorized|cognito-idp:ListUsers|AccessDenied/i.test(detail)
  ) {
    return {
      name,
      detail,
      userMessage:
        "Showing your account only. Grant cognito-idp:ListUsers on the Amplify compute role for the full team list.",
      hint,
    };
  }

  if (name === "ResourceNotFoundException") {
    return {
      name,
      detail,
      userMessage:
        "Showing your account only. Cognito user pool or group was not found. Check NEXT_PUBLIC_USER_POOL_ID and MANAGEMENT_COGNITO_GROUP in Amplify.",
      hint,
    };
  }

  return {
    name,
    detail,
    userMessage: `Showing your account only. Cognito error: ${name}.`,
    hint,
  };
};
