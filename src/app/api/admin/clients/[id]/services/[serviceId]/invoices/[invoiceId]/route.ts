import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  ClientServiceValidationError,
  getClientServiceWithInvoices,
  InvoiceDispatchError,
  updateServiceInvoice,
} from "@/lib/client-services/storage";
import type { UpdateServiceInvoiceInput } from "@/types/clientService";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string; serviceId: string; invoiceId: string };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: UpdateServiceInvoiceInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const invoice = await updateServiceInvoice(
      params.id,
      params.serviceId,
      params.invoiceId,
      body,
      body.markSent || body.resend || body.saveAndResend
        ? {
            actor: { sub: auth.user.sub, email: auth.user.email },
            origin: request.nextUrl.origin,
          }
        : undefined
    );
    const service = await getClientServiceWithInvoices(params.id, params.serviceId);
    return NextResponse.json({ invoice, service });
  } catch (error) {
    if (error instanceof ClientServiceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof InvoiceDispatchError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return handleClientsStorageError(error);
  }
}
