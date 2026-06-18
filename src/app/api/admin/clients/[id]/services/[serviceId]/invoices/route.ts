import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  ClientServiceValidationError,
  createServiceInvoice,
  getClientServiceWithInvoices,
  listInvoicesForService,
} from "@/lib/client-services/storage";
import type { CreateServiceInvoiceInput } from "@/types/clientService";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string; serviceId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const invoices = await listInvoicesForService(params.id, params.serviceId);
    return NextResponse.json({ invoices });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: CreateServiceInvoiceInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const invoice = await createServiceInvoice(params.id, params.serviceId, body);
    const service = await getClientServiceWithInvoices(params.id, params.serviceId);
    return NextResponse.json({ invoice, service }, { status: 201 });
  } catch (error) {
    if (error instanceof ClientServiceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleClientsStorageError(error);
  }
}
