import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  addProviderPayoutBatch,
  ScheduleValidationError,
} from "@/lib/schedule/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string; engagementId: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const engagement = await addProviderPayoutBatch(
      params.id,
      params.engagementId,
      body
    );
    return NextResponse.json({ engagement }, { status: 201 });
  } catch (error) {
    if (error instanceof ScheduleValidationError) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return handleClientsStorageError(error);
  }
}
