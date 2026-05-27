import { fetchAuthSession } from "aws-amplify/auth";
import { isPublicIntakeEnabled } from "@/config/intakeAccess";
import { getOrCreateGuestSessionId } from "@/lib/auth/guestSession";

export const intakeRequestHeaders = async (): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      return headers;
    }
  } catch {
    /* fall through to guest */
  }

  if (isPublicIntakeEnabled()) {
    headers["X-Guest-Session-Id"] = getOrCreateGuestSessionId();
    return headers;
  }

  throw new Error("Not authenticated");
};
