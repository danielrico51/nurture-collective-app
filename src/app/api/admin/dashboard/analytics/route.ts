import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  handleLeadsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  describeClientsCrmStorageScope,
  getClientsCrmStorageScope,
} from "@/lib/clients/config";
import { computeDashboardAnalytics } from "@/lib/dashboard/analytics";
import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

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
    const analytics = await computeDashboardAnalytics(year);
    return NextResponse.json({
      analytics,
      storage: {
        clients: describeClientsCrmStorageScope(getClientsCrmStorageScope()),
        leads: `Lead CRM (${resolveDeploymentEnvironment()} · leads/)`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("lead") || message.includes("Lead")) {
      return handleLeadsStorageError(error);
    }
    return handleClientsStorageError(error);
  }
}
