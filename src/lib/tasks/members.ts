import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  type AttributeType,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import type { TeamMember } from "@/types/teamMember";

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

const attr = (attributes: AttributeType[] | undefined, name: string) =>
  attributes?.find((a) => a.Name === name)?.Value?.trim() ?? "";

const toTeamMember = (user: UserType): TeamMember | null => {
  if (user.UserStatus !== "CONFIRMED" || user.Enabled === false) {
    return null;
  }

  const attributes = user.Attributes;
  const sub = attr(attributes, "sub");
  if (!sub) return null;

  const customUsername = attr(attributes, "custom:username");
  const givenName = attr(attributes, "given_name");
  const familyName = attr(attributes, "family_name");
  const fullName = attr(attributes, "name");
  const email = attr(attributes, "email");
  const username = user.Username ?? customUsername ?? email;

  const label =
    [givenName, familyName].filter(Boolean).join(" ") ||
    fullName ||
    customUsername ||
    email ||
    username;

  return {
    id: sub,
    label,
    username: customUsername || username,
    email,
  };
};

export const listTeamMembers = async (): Promise<TeamMember[]> => {
  const client = getClient();
  const UserPoolId = getUserPoolId();
  const group = process.env.MANAGEMENT_COGNITO_GROUP?.trim();

  const members: TeamMember[] = [];

  if (group) {
    let nextToken: string | undefined;
    do {
      const response = await client.send(
        new ListUsersInGroupCommand({
          UserPoolId,
          GroupName: group,
          Limit: 60,
          NextToken: nextToken,
        })
      );
      for (const user of response.Users ?? []) {
        const member = toTeamMember(user);
        if (member) members.push(member);
      }
      nextToken = response.NextToken;
    } while (nextToken);
  } else {
    let paginationToken: string | undefined;
    do {
      const response = await client.send(
        new ListUsersCommand({
          UserPoolId,
          Limit: 60,
          PaginationToken: paginationToken,
        })
      );
      for (const user of response.Users ?? []) {
        const member = toTeamMember(user);
        if (member) members.push(member);
      }
      paginationToken = response.PaginationToken;
    } while (paginationToken);
  }

  return members.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
};
