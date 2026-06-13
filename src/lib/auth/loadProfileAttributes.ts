import { configureAmplify } from "@/utils/amplifyConfig";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const waitForAuthIdToken = async (maxWaitMs = 8000): Promise<string> => {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) return token;
    await sleep(200);
  }

  throw new Error("Not authenticated");
};

const loadProfileAttributesFromServer = async (): Promise<
  Partial<Record<string, string>>
> => {
  const token = await waitForAuthIdToken();

  const response = await fetch("/api/account/profile", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    attributes?: Record<string, string>;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Could not load profile"
    );
  }

  return payload.attributes ?? {};
};

/** Load Cognito profile attributes, preferring the server API for OAuth sessions. */
export const loadProfileAttributes = async (): Promise<
  Partial<Record<string, string>>
> => {
  configureAmplify();

  try {
    const serverAttributes = await loadProfileAttributesFromServer();
    if (Object.keys(serverAttributes).length > 0) {
      return serverAttributes;
    }
  } catch {
    /* fall through to client-side loaders */
  }

  try {
    return await fetchUserAttributes();
  } catch {
    try {
      await fetchAuthSession({ forceRefresh: true });
      return await fetchUserAttributes();
    } catch {
      try {
        const serverAttributes = await loadProfileAttributesFromServer();
        if (Object.keys(serverAttributes).length > 0) {
          return serverAttributes;
        }
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
  }

  throw new Error("Could not load your profile");
};
