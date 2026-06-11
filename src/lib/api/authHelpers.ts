import { isPublicIntakeEnabled } from "@/config/intakeAccess";
import { isGuestSessionId } from "@/lib/auth/guestSession";
import { verifyRequest, type AuthUser } from "@/lib/auth/verifyRequest";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export interface AuthContext {
  user: AuthUser;
  isGuest: boolean;
}

export const requireAuthUser = async (
  request: NextRequest
): Promise<{ user: AuthUser | null; error: NextResponse | null; isGuest?: boolean }> => {
  const user = await verifyRequest(request);
  if (!user?.sub) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null, isGuest: false };
};

const resolveGuestSessionUser = (
  request: NextRequest
): { user: AuthUser | null; error: NextResponse | null; isGuest: boolean } => {
  const guestId = request.headers.get("X-Guest-Session-Id")?.trim() ?? "";
  if (!isGuestSessionId(guestId)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Missing or invalid X-Guest-Session-Id header" },
        { status: 401 }
      ),
      isGuest: true,
    };
  }

  return {
    user: {
      sub: guestId,
      email: "",
      groups: [],
    },
    error: null,
    isGuest: true,
  };
};

/** Cognito JWT or guest session for standalone /book scheduling (prod-safe). */
export const requireAuthUserOrGuestForScheduling = async (
  request: NextRequest
): Promise<{ user: AuthUser | null; error: NextResponse | null; isGuest: boolean }> => {
  const authed = await verifyRequest(request);
  if (authed?.sub) {
    return { user: authed, error: null, isGuest: false };
  }

  return resolveGuestSessionUser(request);
};

/** Cognito JWT or guest session header when public intake is enabled. */
export const requireAuthUserOrGuest = async (
  request: NextRequest
): Promise<{ user: AuthUser | null; error: NextResponse | null; isGuest: boolean }> => {
  const authed = await verifyRequest(request);
  if (authed?.sub) {
    return { user: authed, error: null, isGuest: false };
  }

  if (!isPublicIntakeEnabled()) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      isGuest: false,
    };
  }

  return resolveGuestSessionUser(request);
};
