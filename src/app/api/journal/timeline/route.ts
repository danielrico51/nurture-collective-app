import { NextRequest, NextResponse } from "next/server";
import { requireJournalMember } from "@/lib/api/journalAuth";
import {
  addJournalTimelineEvent,
  getJournalTimeline,
} from "@/lib/journal/storage";
import type { JourneyEventType } from "@/types/journal";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireJournalMember(request);
  if (auth.error) return auth.error;

  const events = await getJournalTimeline(auth.user!.sub, auth.user!.email);
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const auth = await requireJournalMember(request);
  if (auth.error) return auth.error;

  let body: {
    type?: JourneyEventType;
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

  if (!body.type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const events = await addJournalTimelineEvent(
    auth.user!.sub,
    {
      type: body.type,
      payload: body.payload ?? {},
      occurredAt: body.occurredAt,
      label: body.label,
      note: body.note,
    },
    auth.user!.email
  );

  return NextResponse.json({ events }, { status: 201 });
}
