import {
  ListUsersInGroupCommand,
  type AttributeType,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { getTasksAccessGroup } from "@/lib/auth/groups";
import type { TeamMember } from "@/types/teamMember";
import type { AuthUser } from "@/lib/auth/verifyRequest";
import { getCognitoClient } from "@/lib/tasks/cognitoClient";
import { getUserAssigneeMatchers } from "@/lib/tasks/utils";

const ASSIGNABLE_USER_STATUSES = new Set([
  "CONFIRMED",
  "FORCE_CHANGE_PASSWORD",
  "RESET_REQUIRED",
]);

const getClient = () => getCognitoClient();

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
  if (
    !ASSIGNABLE_USER_STATUSES.has(user.UserStatus ?? "") ||
    user.Enabled === false
  ) {
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
  const group = getTasksAccessGroup();

  const members: TeamMember[] = [];
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

  return members.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
};

export const teamMemberFromAuthUser = (user: AuthUser): TeamMember => {
  const label =
    [user.givenName, user.familyName].filter(Boolean).join(" ") ||
    user.name ||
    user.username ||
    user.email.split("@")[0] ||
    user.email;

  return {
    id: user.sub,
    label,
    username: user.username || user.email.split("@")[0] || user.email,
    email: user.email,
  };
};

export const getAssigneeMatchersForAuthUser = (user: AuthUser): string[] => {
  const member = teamMemberFromAuthUser(user);
  const displayName =
    user.name ||
    [user.givenName, user.familyName].filter(Boolean).join(" ") ||
    undefined;
  return getUserAssigneeMatchers(user.email, displayName, member);
};

export { formatCognitoListError } from "@/lib/tasks/cognitoClient";

export const isCognitoAdminAccessError = (error: unknown) => {
  const err = error as { name?: string; message?: string };
  const message = err.message ?? "";
  return (
    err.name === "AccessDeniedException" ||
    err.name === "UnauthorizedException" ||
    /not authorized|cognito-idp:ListUsers|AccessDenied/i.test(message)
  );
};
