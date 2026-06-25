import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { reallocateProviderEngagement } from "@/lib/schedule/providerEngagements";
import { ScheduleValidationError } from "@/lib/schedule/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const clientId = String(payload.clientId ?? "").trim();
  const engagementId = String(payload.engagementId ?? "").trim();
  const targetProviderId = String(payload.targetProviderId ?? "").trim();

  try {
    const result = await reallocateProviderEngagement({
      fromProviderId: params.id,
      toProviderId: targetProviderId,
      clientId,
      engagementId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ScheduleValidationError) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return handleClientsStorageError(error);
  }
}
