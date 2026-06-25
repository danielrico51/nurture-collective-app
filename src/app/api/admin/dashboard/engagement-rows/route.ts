import { NextRequest, NextResponse } from "next/server";
import {
  describeClientsCrmStorageScope,
  getClientsCrmStorageScope,
} from "@/lib/clients/config";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { computeDashboardEngagementRows } from "@/lib/dashboard/engagementRows";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const force = request.nextUrl.searchParams.get("refresh") === "true";

  try {
    const result = await computeDashboardEngagementRows({ force });
    return NextResponse.json({
      ...result,
      storage: {
        clients: describeClientsCrmStorageScope(getClientsCrmStorageScope()),
      },
    });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}
