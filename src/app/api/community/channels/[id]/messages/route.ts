import { NextRequest } from "next/server";
import {
  proxyCommunityGet,
  proxyCommunityPost,
} from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const query = request.nextUrl.searchParams.toString();
  const path = query
    ? `/api/v1/channels/${encodeURIComponent(id)}/messages/?${query}`
    : `/api/v1/channels/${encodeURIComponent(id)}/messages/`;
  return proxyCommunityGet(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return proxyCommunityPost(
    request,
    `/api/v1/channels/${encodeURIComponent(id)}/messages/`,
    body
  );
}
