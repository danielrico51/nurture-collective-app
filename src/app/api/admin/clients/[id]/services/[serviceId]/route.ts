import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  ClientServiceValidationError,
  getClientServiceWithInvoices,
  updateClientService,
} from "@/lib/client-services/storage";
import type { UpdateClientServiceInput } from "@/types/clientService";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string; serviceId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const service = await getClientServiceWithInvoices(params.id, params.serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: UpdateClientServiceInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await updateClientService(params.id, params.serviceId, body);
    const service = await getClientServiceWithInvoices(params.id, params.serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof ClientServiceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleClientsStorageError(error);
  }
}
