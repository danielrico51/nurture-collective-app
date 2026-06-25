import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { getClientsCrmStorageScope } from "@/lib/clients/config";
import { computeAllProviderStats } from "@/lib/schedule/providerStats";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const stats = await computeAllProviderStats(year);
    return NextResponse.json({
      stats,
      year,
      storage: getClientsCrmStorageScope(),
    });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}
