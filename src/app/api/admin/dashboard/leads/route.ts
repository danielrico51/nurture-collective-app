import { NextRequest, NextResponse } from "next/server";
import {
  handleLeadsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { computeDashboardLeadAnalytics } from "@/lib/dashboard/analytics";
import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const analytics = await computeDashboardLeadAnalytics();
    return NextResponse.json({
      analytics,
      storage: {
        leads: `Lead CRM (${resolveDeploymentEnvironment()} · leads/)`,
      },
    });
  } catch (error) {
    return handleLeadsStorageError(error);
  }
}
