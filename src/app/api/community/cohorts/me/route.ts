import { NextRequest } from "next/server";
import { proxyCommunityGet } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return proxyCommunityGet(request, "/api/v1/cohorts/me/");
}
