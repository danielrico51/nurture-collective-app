import { NextRequest, NextResponse } from "next/server";
import {
  describeClientsCrmStorageScope,
  getClientsCrmStorageScope,
} from "@/lib/clients/config";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { withSelectedYear } from "@/lib/dashboard/analytics";
import { loadDashboardSnapshot } from "@/lib/dashboard/snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const force = request.nextUrl.searchParams.get("refresh") === "true";
  const live = request.nextUrl.searchParams.get("live") === "true";

  try {
    const snapshot = await loadDashboardSnapshot({ force, live });
    const analytics = withSelectedYear(snapshot.engagementAnalytics, year);
    return NextResponse.json({
      analytics,
      storage: {
        clients: describeClientsCrmStorageScope(getClientsCrmStorageScope()),
      },
    });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}
