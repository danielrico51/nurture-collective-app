import { NextRequest, NextResponse } from "next/server";
import {
  describeClientsCrmStorageScope,
  getClientsCrmStorageScope,
} from "@/lib/clients/config";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { loadDashboardSnapshot } from "@/lib/dashboard/snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const force = request.nextUrl.searchParams.get("refresh") === "true";
  const live = request.nextUrl.searchParams.get("live") === "true";

  try {
    const snapshot = await loadDashboardSnapshot({ force, live });
    return NextResponse.json({
      snapshot,
      storage: {
        clients: describeClientsCrmStorageScope(getClientsCrmStorageScope()),
      },
    });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}
