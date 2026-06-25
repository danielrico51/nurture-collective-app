import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { getClientsCrmStorageScope } from "@/lib/clients/config";
import { listProviderEngagements } from "@/lib/schedule/providerEngagements";
import { ScheduleValidationError } from "@/lib/schedule/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const engagements = await listProviderEngagements(params.id);
    return NextResponse.json({
      engagements,
      storage: getClientsCrmStorageScope(),
    });
  } catch (error) {
    if (error instanceof ScheduleValidationError) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return handleClientsStorageError(error);
  }
}
