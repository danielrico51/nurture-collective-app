import { NextRequest } from "next/server";
import { proxyCommunityGet } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyCommunityGet(
    request,
    `/api/v1/communities/${encodeURIComponent(id)}/`
  );
}
