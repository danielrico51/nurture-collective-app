import { NextRequest, NextResponse } from "next/server";
import {
  handleLeadsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { addCoordinatorNote } from "@/lib/leads/storage";
import type { CoordinatorNoteType } from "@/types/lead";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: { body?: string; type?: CoordinatorNoteType };
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
    const note = await addCoordinatorNote(
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
    return handleLeadsStorageError(error);
  }
}
