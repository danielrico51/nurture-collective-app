import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { getClientsCrmStorageScope } from "@/lib/clients/config";
import {
  listProviderPayoutReport,
  ScheduleValidationError,
} from "@/lib/schedule/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const params = request.nextUrl.searchParams;
    const statusParam = params.get("status");
    const status =
      statusParam === "pending" || statusParam === "paid"
        ? statusParam
        : "all";

    const payouts = await listProviderPayoutReport({
      providerId: params.get("providerId") ?? undefined,
      status,
      fromDate: params.get("from") ?? undefined,
      toDate: params.get("to") ?? undefined,
    });

    return NextResponse.json({
      payouts,
      storage: getClientsCrmStorageScope(),
    });
  } catch (error) {
    if (error instanceof ScheduleValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleClientsStorageError(error);
  }
}
