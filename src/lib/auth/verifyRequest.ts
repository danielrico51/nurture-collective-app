import { CognitoJwtVerifier } from "aws-jwt-verify";
import { NextRequest } from "next/server";

export interface AuthUser {
  sub: string;
  email: string;
  groups: string[];
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
    const payload = await getVerifier().verify(token);
    const groupsRaw = payload["cognito:groups"];
    const groups = Array.isArray(groupsRaw)
      ? groupsRaw.map(String)
      : groupsRaw
        ? [String(groupsRaw)]
        : [];

    return {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? payload["cognito:username"] ?? ""),
      groups,
    };
  } catch {
    return null;
  }
};

export const isManagementUser = (user: AuthUser): boolean => {
  const requiredGroup = process.env.MANAGEMENT_COGNITO_GROUP?.trim();
  if (!requiredGroup) return true;
  return user.groups.includes(requiredGroup);
};
