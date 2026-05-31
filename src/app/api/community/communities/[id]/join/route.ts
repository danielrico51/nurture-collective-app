import { NextRequest } from "next/server";
import { proxyCommunityPost } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyCommunityPost(
    request,
    `/api/v1/communities/${encodeURIComponent(id)}/join/`,
    {}
  );
}
