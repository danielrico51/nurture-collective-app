import { NextRequest, NextResponse } from "next/server";
import { requireJournalMember } from "@/lib/api/journalAuth";
import { createJournalEntry, listJournalEntries } from "@/lib/journal/storage";
import type { JournalEntryInput } from "@/types/journal";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireJournalMember(request);
  if (auth.error) return auth.error;

  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;

  const items = await listJournalEntries(
    auth.user!.sub,
    { from, to },
    auth.user!.email
  );
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireJournalMember(request);
  if (auth.error) return auth.error;

  let body: JournalEntryInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const entry = await createJournalEntry(auth.user!.sub, body, auth.user!.email);
  return NextResponse.json({ entry }, { status: 201 });
}
