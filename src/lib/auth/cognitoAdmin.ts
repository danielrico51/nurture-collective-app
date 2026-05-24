import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { getMissingRequiredAttributes } from "@/lib/auth/poolAttributes";

const getClient = () => {
  const region =
    process.env.AWS_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    "us-east-1";
  return new CognitoIdentityProviderClient({ region });
};

const getUserPoolId = () => {
  const poolId = process.env.NEXT_PUBLIC_USER_POOL_ID?.trim();
  if (!poolId) {
    throw new Error("NEXT_PUBLIC_USER_POOL_ID is not configured");
  }
  return poolId;
};

export const getUserAttributesByUsername = async (username: string) => {
  const response = await getClient().send(
    new AdminGetUserCommand({
      UserPoolId: getUserPoolId(),
      Username: username,
    })
  );

  const attributes: Record<string, string> = {};
  for (const attr of response.UserAttributes ?? []) {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  }
  return attributes;
};

export { getMissingRequiredAttributes } from "@/lib/auth/poolAttributes";

export const getProfileForPasswordChallenge = async (username: string) => {
  const attributes = await getUserAttributesByUsername(username);
  return getMissingRequiredAttributes(attributes, username);
};
