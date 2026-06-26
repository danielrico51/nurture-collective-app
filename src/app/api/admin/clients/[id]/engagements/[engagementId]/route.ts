import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  deleteServiceEngagement,
  getEngagementDetail,
  ScheduleValidationError,
  updateServiceEngagement,
} from "@/lib/schedule/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string; engagementId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const engagement = await getEngagementDetail(params.id, params.engagementId);
    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }
    return NextResponse.json({ engagement });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const engagement = await updateServiceEngagement(
      params.id,
      params.engagementId,
      body
    );
    return NextResponse.json({ engagement });
  } catch (error) {
    if (error instanceof ScheduleValidationError) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return handleClientsStorageError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    await deleteServiceEngagement(params.id, params.engagementId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ScheduleValidationError) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return handleClientsStorageError(error);
  }
}
