import { NextRequest, NextResponse } from "next/server";
import { requireJournalMember } from "@/lib/api/journalAuth";
import { getTodayCheckIn } from "@/lib/journal/storage";
import { pickDailyPrompt } from "@/lib/journal/prompts";
import { getJournalProfile } from "@/lib/journal/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireJournalMember(request);
  if (auth.error) return auth.error;

  const [checkIn, profile] = await Promise.all([
    getTodayCheckIn(auth.user!.sub, auth.user!.email),
    getJournalProfile(auth.user!.sub, auth.user!.email),
  ]);

  const prompt = pickDailyPrompt(profile.maternalStage);

  return NextResponse.json({ checkIn, prompt });
}
