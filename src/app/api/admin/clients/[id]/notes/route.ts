import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { addClientNote } from "@/lib/clients/storage";
import type { ClientNoteType } from "@/types/client";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: { body?: string; type?: ClientNoteType };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.body?.trim();
  if (!text) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }

  try {
    const note = await addClientNote(
      params.id,
      { id: auth.user.sub, email: auth.user.email },
      { body: text, type: body.type }
    );
    return NextResponse.json({ note });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save note";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return handleClientsStorageError(error);
  }
}
