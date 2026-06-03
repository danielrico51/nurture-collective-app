import { NextRequest, NextResponse } from "next/server";
import {
  proxyCommunityDelete,
  proxyCommunityGet,
  proxyCommunityPatch,
} from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

const postPath = (communityId: string, postId: string) =>
  `/api/v1/communities/${encodeURIComponent(communityId)}/posts/${encodeURIComponent(postId)}/`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id, postId } = await params;
  return proxyCommunityGet(request, postPath(id, postId));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id, postId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return proxyCommunityPatch(request, postPath(id, postId), body);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id, postId } = await params;
  return proxyCommunityDelete(request, postPath(id, postId));
}
