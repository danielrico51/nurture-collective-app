import { NextRequest } from "next/server";
import { proxyCommunityPost } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  const { cohortId } = await params;
  return proxyCommunityPost(
    request,
    `/api/v1/cohorts/${encodeURIComponent(cohortId)}/join/`,
    {}
  );
}
