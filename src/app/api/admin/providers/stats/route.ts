import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { getClientsCrmStorageScope } from "@/lib/clients/config";
import { loadCrmStorageIndex } from "@/lib/clients/crmIndexLoader";
import { loadDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { listProviders } from "@/lib/providers/storage";
import {
  computeAllProviderStats,
  computeAllProviderStatsFromSchedule,
} from "@/lib/schedule/providerStats";

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

  try {
    const snapshot = await loadDashboardSnapshot();
    if (snapshot.providerStats && snapshot.providerStatsYear === year) {
      return NextResponse.json({
        stats: snapshot.providerStats,
        year,
        storage: getClientsCrmStorageScope(),
        source: "snapshot",
        generatedAt: snapshot.generatedAt,
      });
    }

    if (year !== snapshot.providerStatsYear) {
      const [crmIndex, providers] = await Promise.all([
        loadCrmStorageIndex(),
        listProviders({ includeArchived: true }),
      ]);
      const stats = computeAllProviderStatsFromSchedule(
        crmIndex.schedule,
        providers,
        year
      );
      return NextResponse.json({
        stats,
        year,
        storage: getClientsCrmStorageScope(),
        source: "index",
        generatedAt: crmIndex.loadedAt,
      });
    }

    const stats = await computeAllProviderStats(year);
    return NextResponse.json({
      stats,
      year,
      storage: getClientsCrmStorageScope(),
      source: "live",
    });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}
