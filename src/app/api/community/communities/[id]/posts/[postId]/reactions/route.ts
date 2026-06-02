import { NextRequest } from "next/server";
import {
  proxyCommunityDelete,
  proxyCommunityPost,
} from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id, postId } = await params;
  const body = await request.json().catch(() => ({}));
  return proxyCommunityPost(
    request,
    `/api/v1/communities/${encodeURIComponent(id)}/posts/${encodeURIComponent(postId)}/reactions/`,
    body
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id, postId } = await params;
  return proxyCommunityDelete(
    request,
    `/api/v1/communities/${encodeURIComponent(id)}/posts/${encodeURIComponent(postId)}/reactions/`
  );
}
