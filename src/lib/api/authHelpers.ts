import { verifyRequest, type AuthUser } from "@/lib/auth/verifyRequest";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const requireAuthUser = async (
  request: NextRequest
): Promise<{ user: AuthUser | null; error: NextResponse | null }> => {
  const user = await verifyRequest(request);
  if (!user?.sub) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null };
};
