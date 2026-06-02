import { NextRequest } from "next/server";
import {
  proxyCommunityGet,
  proxyCommunityPost,
} from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `/api/v1/channels/?${query}` : "/api/v1/channels/";
  return proxyCommunityGet(request, path);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyCommunityPost(request, "/api/v1/channels/", body);
}
