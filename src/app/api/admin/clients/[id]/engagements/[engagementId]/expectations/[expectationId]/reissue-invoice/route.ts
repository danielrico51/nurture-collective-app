import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { ClientServiceValidationError } from "@/lib/client-services/storage";
import {
  reissuePaymentExpectationInvoice,
  ScheduleValidationError,
} from "@/lib/schedule/storage";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string; engagementId: string; expectationId: string };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  try {
    const engagement = await reissuePaymentExpectationInvoice(
      params.id,
      params.engagementId,
      params.expectationId,
      {
        actor: { sub: auth.user.sub, email: auth.user.email },
        origin: request.nextUrl.origin,
      }
    );
    return NextResponse.json({ engagement });
  } catch (error) {
    if (error instanceof ScheduleValidationError) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof ClientServiceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleClientsStorageError(error);
  }
}
