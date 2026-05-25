import type { AuthSession } from "aws-amplify/auth";

export const parseGroupsFromPayload = (
  payload: Record<string, unknown> | undefined
): string[] => {
  const raw = payload?.["cognito:groups"];
  if (Array.isArray(raw)) return raw.map(String);
  if (raw) return [String(raw)];
  return [];
};

/** Read Cognito groups from ID and access token claims. */
export const extractGroupsFromSession = (
  session: AuthSession | undefined
): string[] => {
  const idGroups = parseGroupsFromPayload(
    session?.tokens?.idToken?.payload as Record<string, unknown> | undefined
  );
  const accessGroups = parseGroupsFromPayload(
    session?.tokens?.accessToken?.payload as Record<string, unknown> | undefined
  );

  return Array.from(new Set([...idGroups, ...accessGroups]));
};
