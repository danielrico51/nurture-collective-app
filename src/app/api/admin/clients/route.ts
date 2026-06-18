import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { createManualClient, listClients } from "@/lib/clients/storage";
import { clientsCrmStorageConfig } from "@/lib/clients/config";
import { ClientValidationError } from "@/lib/clients/manualClient";
import { CoordinatorAssignmentError } from "@/lib/leads/coordinatorAssignment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const includeArchived =
      request.nextUrl.searchParams.get("includeArchived") === "true";
    const clients = (await listClients()).filter(
      (client) => includeArchived || !client.archivedAt
    );
    return NextResponse.json({
      clients,
      storage: {
        deploymentEnvironment: clientsCrmStorageConfig.deploymentEnvironment,
        scope: clientsCrmStorageConfig.s3Prefix,
      },
    });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const client = await createManualClient(body, {
      id: auth.user.sub,
      email: auth.user.email,
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof ClientValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof CoordinatorAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleClientsStorageError(error);
  }
}
