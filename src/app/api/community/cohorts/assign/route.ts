import { NextRequest } from "next/server";
import { proxyCommunityPost } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  return proxyCommunityPost(request, "/api/v1/cohorts/assign/", body);
}
