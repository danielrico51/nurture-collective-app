import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import {
  getServerCredentialHint,
  getServerCredentials,
  hasExplicitServerCredentials,
} from "@/lib/aws/amplifyCredentials";

export const getCognitoRegion = () =>
  process.env.AWS_REGION ??
  process.env.NEXT_PUBLIC_AWS_REGION ??
  "us-east-1";

export const getCognitoClient = () =>
  new CognitoIdentityProviderClient({
    region: getCognitoRegion(),
    credentials: getServerCredentials(),
  });

export const getRuntimeCredentialHint = () => ({
  ...getServerCredentialHint(),
  usingExplicitServerCredentials: hasExplicitServerCredentials(),
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
      userMessage: hint.usingExplicitServerCredentials
        ? "Showing your account only. Server AWS credentials are configured but Cognito still could not be reached."
        : "Showing your account only. Set SERVER_AWS_ACCESS_KEY_ID and SERVER_AWS_SECRET_ACCESS_KEY in Amplify environment variables for the team list.",
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
        "Showing your account only. The server IAM user needs cognito-idp:ListUsers on your user pool.",
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
