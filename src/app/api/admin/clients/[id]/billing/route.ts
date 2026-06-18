import { NextRequest, NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import { getClientById } from "@/lib/clients/storage";
import { createPurchaseCheckout } from "@/lib/billing/createPurchaseCheckout";
import { listPurchaseOrdersForClient } from "@/lib/billing/listOrders";
import type { PurchaseLineItem } from "@/types/billing";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

const parseLineItems = (raw: unknown): PurchaseLineItem[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("At least one line item is required");
  }
  return raw.map((item) => {
    const record = item as Record<string, unknown>;
    const name = String(record.name ?? "").trim();
    const quantity = Number(record.quantity ?? 1);
    const unitAmountCents = Number(record.unitAmountCents ?? 0);
    if (!name) throw new Error("Each line item needs a name");
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Each line item needs a positive quantity");
    }
    if (!Number.isFinite(unitAmountCents) || unitAmountCents <= 0) {
      throw new Error("Each line item needs a positive amount");
    }
    return {
      sku: String(record.sku ?? name).slice(0, 64),
      name,
      description: record.description ? String(record.description) : undefined,
      quantity,
      unitAmountCents: Math.round(unitAmountCents),
    };
  });
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const orders = await listPurchaseOrdersForClient(params.id);
    return NextResponse.json({ orders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load billing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: {
    mode?: "invoice" | "charge";
    lineItems?: unknown;
    customerEmail?: string;
    customerName?: string;
    successUrl?: string;
    cancelUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const client = await getClientById(params.id);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const customerEmail = (body.customerEmail || client.email).trim();
  if (!customerEmail) {
    return NextResponse.json(
      { error: "Client has no email — add one before invoicing" },
      { status: 400 }
    );
  }

  let lineItems: PurchaseLineItem[];
  try {
    lineItems = parseLineItems(body.lineItems);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid line items";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const invoiceOnly = body.mode !== "charge";
  const origin = request.nextUrl.origin;

  try {
    const result = await createPurchaseCheckout({
      customerEmail,
      customerName: body.customerName || client.name,
      clientId: client.clientId,
      leadId: client.leadId ?? undefined,
      lineItems,
      invoiceOnly,
      successUrl: body.successUrl || `${origin}/admin/clients`,
      cancelUrl: body.cancelUrl || `${origin}/admin/clients`,
      metadata: { clientId: client.clientId },
    });
    return NextResponse.json(
      { order: result.order, payment: result.payment },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create billing order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
