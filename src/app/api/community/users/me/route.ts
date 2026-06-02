import { NextRequest } from "next/server";
import {
  handleCommunityProxyError,
  proxyCommunityGet,
  proxyCommunityPatch,
  requireMemberAuth,
} from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return proxyCommunityGet(request, "/api/v1/users/me/");
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    return proxyCommunityPatch(request, "/api/v1/users/me/", body);
  } catch (error) {
    return handleCommunityProxyError(error);
  }
}
