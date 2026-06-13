import {
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getMissingRequiredAttributes } from "@/lib/auth/poolAttributes";
import { getCognitoClient } from "@/lib/tasks/cognitoClient";

const getUserPoolId = () => {
  const poolId = process.env.NEXT_PUBLIC_USER_POOL_ID?.trim();
  if (!poolId) {
    throw new Error("NEXT_PUBLIC_USER_POOL_ID is not configured");
  }
  return poolId;
};

/** Cognito ListUsers filters to resolve a member by sign-in username or email alias. */
export const buildCognitoUserLookupFilters = (username: string): string[] => {
  const normalized = username.trim();
  if (!normalized) return [];

  if (normalized.includes("@")) {
    return [`email = "${normalized}"`, `username = "${normalized}"`];
  }

  return [`username = "${normalized}"`];
};

const attributesFromCognito = (
  attrs?: Array<{ Name?: string; Value?: string }>
): Record<string, string> => {
  const attributes: Record<string, string> = {};
  for (const attr of attrs ?? []) {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  }
  return attributes;
};

const attributesFromListUser = (
  user: { Attributes?: Array<{ Name?: string; Value?: string }> }
): Record<string, string> => attributesFromCognito(user.Attributes);

const findUserByListFilters = async (username: string) => {
  const client = getCognitoClient();
  const poolId = getUserPoolId();

  for (const filter of buildCognitoUserLookupFilters(username)) {
    try {
      const response = await client.send(
        new ListUsersCommand({
          UserPoolId: poolId,
          Filter: filter,
          Limit: 1,
        })
      );
      const user = response.Users?.[0];
      if (user) {
        return attributesFromListUser(user);
      }
    } catch (error) {
      console.warn("[auth] Cognito ListUsers filter failed:", filter, error);
    }
  }

  return null;
};

export const getUserAttributesByUsername = async (username: string) => {
  const listed = await findUserByListFilters(username);
  if (listed) {
    return listed;
  }

  try {
    const response = await getCognitoClient().send(
      new AdminGetUserCommand({
        UserPoolId: getUserPoolId(),
        Username: username.trim(),
      })
    );

    return attributesFromCognito(response.UserAttributes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`User not found (${username}): ${message}`);
  }
};

export const getProfileForPasswordChallenge = async (username: string) => {
  const attributes = await getUserAttributesByUsername(username);
  return getMissingRequiredAttributes(attributes, username);
};

const findPoolUsernameBySub = async (sub: string) => {
  const normalized = sub.trim();
  if (!normalized) return null;

  try {
    const response = await getCognitoClient().send(
      new ListUsersCommand({
        UserPoolId: getUserPoolId(),
        Filter: `sub = "${normalized}"`,
        Limit: 1,
      })
    );
    const username = response.Users?.[0]?.Username;
    return typeof username === "string" && username.trim() ? username : null;
  } catch (error) {
    console.warn("[auth] Cognito ListUsers sub lookup failed:", error);
    return null;
  }
};

export const resolveCognitoPoolUsername = async ({
  cognitoUsername,
  sub,
}: {
  cognitoUsername: string;
  sub: string;
}) => {
  const candidates = Array.from(
    new Set([cognitoUsername.trim(), sub.trim()].filter(Boolean))
  );

  for (const candidate of candidates) {
    try {
      await getCognitoClient().send(
        new AdminGetUserCommand({
          UserPoolId: getUserPoolId(),
          Username: candidate,
        })
      );
      return candidate;
    } catch {
      /* try next candidate */
    }
  }

  const bySub = await findPoolUsernameBySub(sub);
  if (bySub) return bySub;

  throw new Error("User not found");
};

export const updateMemberProfileAttributes = async ({
  cognitoUsername,
  sub,
  attributes,
}: {
  cognitoUsername: string;
  sub: string;
  attributes: Record<string, string>;
}) => {
  const username = await resolveCognitoPoolUsername({ cognitoUsername, sub });
  const userAttributes = Object.entries(attributes)
    .filter(([, value]) => value.trim().length > 0)
    .map(([Name, Value]) => ({ Name, Value: Value.trim() }));

  if (userAttributes.length === 0) {
    return;
  }

  await getCognitoClient().send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: getUserPoolId(),
      Username: username,
      UserAttributes: userAttributes,
    })
  );
};
