import { configureAmplify } from "@/utils/amplifyConfig";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";

const idTokenAttributes = (
  payload: Record<string, unknown> | undefined
): Partial<Record<string, string>> => {
  if (!payload) return {};

  const read = (key: string) => {
    const value = payload[key];
    return typeof value === "string" ? value : undefined;
  };

  return {
    email: read("email"),
    given_name: read("given_name"),
    family_name: read("family_name"),
    name: read("name"),
    address: read("address"),
    phone_number: read("phone_number"),
    "custom:username": read("custom:username"),
  };
};

/** Load Cognito profile attributes, with refresh + ID token fallback for OAuth sessions. */
export const loadProfileAttributes = async (): Promise<
  Partial<Record<string, string>>
> => {
  configureAmplify();

  try {
    return await fetchUserAttributes();
  } catch {
    try {
      await fetchAuthSession({ forceRefresh: true });
      return await fetchUserAttributes();
    } catch {
      const session = await fetchAuthSession();
      const fromIdToken = idTokenAttributes(
        session.tokens?.idToken?.payload as Record<string, unknown> | undefined
      );

      if (Object.values(fromIdToken).some(Boolean)) {
        return fromIdToken;
      }

      throw new Error("Could not load your profile");
    }
  }
};
