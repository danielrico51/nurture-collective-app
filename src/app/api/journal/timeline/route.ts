import { NextRequest, NextResponse } from "next/server";
import { requireJournalMember } from "@/lib/api/journalAuth";
import { runJournalRoute } from "@/lib/api/journalRoute";
import {
  addJournalTimelineEvent,
  getJournalTimeline,
} from "@/lib/journal/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runJournalRoute(async () => {
    const auth = await requireJournalMember(request);
    if (auth.error) return auth.error;

    const events = await getJournalTimeline(auth.user!.sub, auth.user!.email);
    return NextResponse.json({ events });
  });
}

export async function POST(request: NextRequest) {
  return runJournalRoute(async () => {
    const auth = await requireJournalMember(request);
    if (auth.error) return auth.error;

    let body: {
      type: string;
      payload?: Record<string, unknown>;
      occurredAt?: string;
      label?: string;
      note?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.type?.trim()) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const events = await addJournalTimelineEvent(
      auth.user!.sub,
      {
        type: body.type as Parameters<typeof addJournalTimelineEvent>[1]["type"],
        payload: body.payload ?? {},
        occurredAt: body.occurredAt,
        label: body.label,
        note: body.note,
      },
      auth.user!.email
    );
    return NextResponse.json({ events }, { status: 201 });
  });
}
