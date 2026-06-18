import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { readServiceInvoice } from "@/lib/client-services/storage";
import { readInvoiceHtmlDocument } from "@/lib/invoices/persistDocument";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string; serviceId: string; invoiceId: string };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const invoice = await readServiceInvoice(
      params.id,
      params.serviceId,
      params.invoiceId
    );
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const html = await readInvoiceHtmlDocument({
      clientId: params.id,
      serviceId: params.serviceId,
      invoiceId: params.invoiceId,
    });

    if (!html) {
      return NextResponse.json(
        { error: "Invoice document has not been generated yet" },
        { status: 404 }
      );
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}
