import { NextRequest, NextResponse } from "next/server";
import { requireJournalMember } from "@/lib/api/journalAuth";
import { getJournalProfile, updateJournalProfile } from "@/lib/journal/storage";
import { syncJournalToCommunity } from "@/lib/journal/syncCommunity";
import type { JournalProfilePatch } from "@/types/journal";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireJournalMember(request);
  if (auth.error) return auth.error;

  const profile = await getJournalProfile(auth.user!.sub, auth.user!.email);
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireJournalMember(request);
  if (auth.error) return auth.error;

  let body: JournalProfilePatch = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { profile, timeline } = await updateJournalProfile(
    auth.user!.sub,
    body,
    auth.user!.email
  );

  if (auth.authorizationHeader) {
    void syncJournalToCommunity(auth.authorizationHeader, profile).catch(
      (err) => console.warn("[journal] sync failed:", err)
    );
  }

  return NextResponse.json({ profile, timeline });
}
