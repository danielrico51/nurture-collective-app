import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { linkClientCognitoUser, linkClientLead } from "@/lib/clients/storage";
import type { ClientRecord, LinkClientInput } from "@/types/client";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: LinkClientInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.leadId === undefined && body.cognitoSub === undefined) {
    return NextResponse.json(
      { error: "Provide leadId and/or cognitoSub (null to unlink)" },
      { status: 400 }
    );
  }

  try {
    let client: ClientRecord | null = null;
    if (body.leadId !== undefined) {
      client = await linkClientLead(params.id, body.leadId ?? null);
    }
    if (body.cognitoSub !== undefined) {
      client = await linkClientCognitoUser(params.id, body.cognitoSub ?? null);
    }
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Link failed";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return handleClientsStorageError(error);
  }
}
