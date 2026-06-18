import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { CoordinatorAssignmentError } from "@/lib/leads/coordinatorAssignment";
import {
  archiveClient,
  assignClientToCoordinator,
  ClientUpdateValidationError,
  getClientDetail,
  restoreClient,
  updateClient,
} from "@/lib/clients/storage";
import { CLIENT_STATUSES } from "@/types/client";
import type { ClientStatus, UpdateClientInput } from "@/types/client";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const detail = await getClientDetail(params.id);
    if (!detail) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return handleClientsStorageError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: UpdateClientInput & {
    coordinatorId?: string;
    archive?: boolean;
    restore?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.archive) {
      const client = await archiveClient(params.id);
      return NextResponse.json({ client });
    }

    if (body.restore) {
      const client = await restoreClient(params.id);
      return NextResponse.json({ client });
    }

    if (body.coordinatorId !== undefined) {
      const client = await assignClientToCoordinator(
        params.id,
        body.coordinatorId
      );
      return NextResponse.json({ client });
    }

    if (body.status && !CLIENT_STATUSES.includes(body.status as ClientStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { archive: _archive, restore: _restore, ...updates } = body;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No update specified" },
        { status: 400 }
      );
    }

    const client = await updateClient(params.id, updates);
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    if (error instanceof CoordinatorAssignmentError) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (error instanceof ClientUpdateValidationError) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return handleClientsStorageError(error);
  }
}
