import { configureAmplify } from "@/utils/amplifyConfig";
import { fetchAuthSession } from "aws-amplify/auth";

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    /* ignore */
  }

  return "Could not save profile";
};

/** Persist Cognito profile attributes via the server API (works for OAuth sessions). */
export const saveProfileAttributes = async (
  userAttributes: Record<string, string>
): Promise<void> => {
  configureAmplify();

  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch("/api/account/profile", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ attributes: userAttributes }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};
