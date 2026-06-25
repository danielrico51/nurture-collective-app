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
import {
  computeDashboardEngagementAnalytics,
  computeDashboardLeadAnalytics,
} from "@/lib/dashboard/analytics";
import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Combined analytics (legacy). Prefer /leads and /engagements for faster loads. */
export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const force = request.nextUrl.searchParams.get("refresh") === "true";

  try {
    const [leads, engagements] = await Promise.all([
      computeDashboardLeadAnalytics(),
      computeDashboardEngagementAnalytics(year, { force }),
    ]);

    return NextResponse.json({
      analytics: {
        generatedAt: new Date().toISOString(),
        year,
        summary: engagements.summary,
        byYear: engagements.byYear,
        byServiceType: engagements.byServiceType,
        byStatus: engagements.byStatus,
        leads: leads.leads,
        monthlyLeads: leads.monthlyLeads,
        monthlyEngagementBookings: engagements.monthlyEngagementBookings,
        topProviders: engagements.topProviders,
      },
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
