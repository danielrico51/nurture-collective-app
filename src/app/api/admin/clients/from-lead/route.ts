import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { convertLeadToClient } from "@/lib/clients/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: { leadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const leadId = body.leadId?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  try {
    const { client, created } = await convertLeadToClient(leadId, {
      id: auth.user.sub,
      email: auth.user.email,
    });
    return NextResponse.json({ client, created }, { status: created ? 201 : 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not convert lead";
    if (message.includes("Lead not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return handleClientsStorageError(error);
  }
}
