import { NextRequest } from "next/server";
import { proxyCommunityGet } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id, postId } = await params;
  return proxyCommunityGet(
    request,
    `/api/v1/communities/${encodeURIComponent(id)}/posts/${encodeURIComponent(postId)}/`
  );
}
