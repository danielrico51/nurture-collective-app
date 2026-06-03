import { NextRequest, NextResponse } from "next/server";
import { requireJournalMember } from "@/lib/api/journalAuth";
import { runJournalRoute } from "@/lib/api/journalRoute";
import {
  deleteJournalEntry,
  getJournalEntry,
  updateJournalEntry,
} from "@/lib/journal/storage";
import type { JournalEntryInput } from "@/types/journal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  return runJournalRoute(async () => {
    const auth = await requireJournalMember(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const entry = await getJournalEntry(auth.user!.sub, id, auth.user!.email);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return runJournalRoute(async () => {
    const auth = await requireJournalMember(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    let body: Partial<JournalEntryInput>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const entry = await updateJournalEntry(
      auth.user!.sub,
      id,
      body,
      auth.user!.email
    );
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return runJournalRoute(async () => {
    const auth = await requireJournalMember(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const deleted = await deleteJournalEntry(
      auth.user!.sub,
      id,
      auth.user!.email
    );
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
