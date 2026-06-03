import { NextRequest } from "next/server";
import { proxyCommunityGet } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cohortType = request.nextUrl.searchParams.get("cohort_type");
  const query = cohortType
    ? `?cohort_type=${encodeURIComponent(cohortType)}`
    : "";
  return proxyCommunityGet(request, `/api/v1/cohorts/${query}`);
}
