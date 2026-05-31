import { NextRequest, NextResponse } from "next/server";
import { readPurchaseOrder } from "@/lib/billing/storage";
import { verifyRequest } from "@/lib/auth/verifyRequest";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const orderId = params.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const order = await readPurchaseOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const user = await verifyRequest(request);
  const isOwner =
    Boolean(user?.sub && order.userId && user.sub === order.userId) ||
    Boolean(user?.email && user.email.toLowerCase() === order.customerEmail);

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, order });
}
