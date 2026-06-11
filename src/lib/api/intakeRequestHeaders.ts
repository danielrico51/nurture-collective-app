import { fetchAuthSession } from "aws-amplify/auth";
import {
  isMemberIntakePath,
  isPublicIntakeEnabled,
  PUBLIC_INTAKE_PATH,
} from "@/config/intakeAccess";
import { getOrCreateGuestSessionId } from "@/lib/auth/guestSession";

const GUEST_BOOKING_PATH = "/book";

const isGuestApiRoute = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname === PUBLIC_INTAKE_PATH ||
    window.location.pathname === GUEST_BOOKING_PATH
  );
};

export const intakeRequestHeaders = async (): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const memberIntakeRoute =
    typeof window !== "undefined" && isMemberIntakePath(window.location.pathname);

  // Public /intake must always use the guest session id — even if Cognito tokens
  // exist in the browser, or saved conversations won't match on send.
  if (isPublicIntakeEnabled() && isGuestApiRoute()) {
    headers["X-Guest-Session-Id"] = getOrCreateGuestSessionId();
    return headers;
  }

  // Signed-in member intake must never fall back to guest auth.
  if (memberIntakeRoute) {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      throw new Error("Not authenticated");
    }
    headers.Authorization = `Bearer ${token}`;
    return headers;
  }

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
