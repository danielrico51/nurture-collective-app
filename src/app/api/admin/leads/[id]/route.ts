import { NextRequest, NextResponse } from "next/server";
import {
  handleLeadsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  assignLeadToCoordinator,
  archiveLead,
  getLeadDetail,
  restoreLead,
  updateLeadStatus,
} from "@/lib/leads/storage";
import type { LeadStatus } from "@/types/lead";
import { LEAD_STATUSES } from "@/types/lead";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(_request);
  if (auth.error) return auth.error;

  try {
    const detail = await getLeadDetail(params.id);
    if (!detail) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return handleLeadsStorageError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: {
    status?: LeadStatus;
    assignToMe?: boolean;
    archive?: boolean;
    restore?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.assignToMe) {
      const lead = await assignLeadToCoordinator(params.id, {
        id: auth.user.sub,
        email: auth.user.email,
      });
      return NextResponse.json({ lead });
    }

    if (body.archive) {
      const lead = await archiveLead(params.id);
      return NextResponse.json({ lead });
    }

    if (body.restore) {
      const lead = await restoreLead(params.id);
      return NextResponse.json({ lead });
    }

    if (body.status) {
      if (!LEAD_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const lead = await updateLeadStatus(params.id, body.status);
      return NextResponse.json({ lead });
    }

    return NextResponse.json({ error: "No update specified" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("Cannot transition")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    return handleLeadsStorageError(error);
  }
}
