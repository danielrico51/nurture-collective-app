import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";

export const requireJournalMember = async (request: NextRequest) => {
  const user = await verifyRequest(request);
  if (!user?.sub) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      authorizationHeader: null,
    };
  }
  const authorizationHeader = request.headers.get("authorization");
  return {
    error: null,
    user,
    authorizationHeader:
      authorizationHeader?.startsWith("Bearer ") ? authorizationHeader : null,
  };
};
