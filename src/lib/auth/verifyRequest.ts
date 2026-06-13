import { CognitoJwtVerifier } from "aws-jwt-verify";
import { NextRequest } from "next/server";
import { canAccessManagementTasks } from "@/lib/auth/groups";

export interface AuthUser {
  sub: string;
  email: string;
  groups: string[];
  givenName?: string;
  familyName?: string;
  name?: string;
  username?: string;
  cognitoUsername: string;
}

const getVerifier = () => {
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error("Cognito environment variables are not configured");
  }

  return CognitoJwtVerifier.create({
    userPoolId,
    tokenUse: "id",
    clientId,
  });
};

export const verifyRequest = async (
  request: NextRequest
): Promise<AuthUser | null> => {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  if (!token) return null;

  try {
    let payload;
    try {
      payload = await getVerifier().verify(token);
    } catch (configError) {
      if (
        configError instanceof Error &&
        configError.message.includes("Cognito environment variables are not configured")
      ) {
        throw configError;
      }
      return null;
    }
    const groupsRaw = payload["cognito:groups"];
    const groups = Array.isArray(groupsRaw)
      ? groupsRaw.map(String)
      : groupsRaw
        ? [String(groupsRaw)]
        : [];

    const cognitoUsername = String(
      payload["cognito:username"] ?? payload.sub ?? ""
    );

    return {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? cognitoUsername),
      groups,
      givenName: payload.given_name ? String(payload.given_name) : undefined,
      familyName: payload.family_name ? String(payload.family_name) : undefined,
      name: payload.name ? String(payload.name) : undefined,
      username: payload["custom:username"]
        ? String(payload["custom:username"])
        : payload.preferred_username
          ? String(payload.preferred_username)
          : undefined,
      cognitoUsername,
    };
  } catch {
    return null;
  }
};

export const isManagementUser = (user: AuthUser): boolean =>
  canAccessManagementTasks(user.groups);
