import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  ClientServiceValidationError,
  createClientService,
  listClientServicesWithInvoices,
} from "@/lib/client-services/storage";
import { ensureAllEngagementPaymentInvoicesSynced } from "@/lib/schedule/engagementBillingSync";
import { listEngagementIdsForClient } from "@/lib/schedule/storage";
import type { CreateClientServiceInput } from "@/types/clientService";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const engagementIds = await listEngagementIdsForClient(params.id);
    await ensureAllEngagementPaymentInvoicesSynced(params.id, engagementIds);
    const services = await listClientServicesWithInvoices(params.id);
    return NextResponse.json({ services });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: CreateClientServiceInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const service = await createClientService(params.id, body);
    const withInvoices = await listClientServicesWithInvoices(params.id);
    const created = withInvoices.find((item) => item.serviceId === service.serviceId);
    return NextResponse.json(
      { service: created ?? { ...service, invoices: [], paidCents: 0, balanceDueCents: service.totalFeeCents } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ClientServiceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleClientsStorageError(error);
  }
}
