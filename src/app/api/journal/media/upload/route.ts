import { NextRequest, NextResponse } from "next/server";
import { requireJournalMember } from "@/lib/api/journalAuth";
import { runJournalRoute } from "@/lib/api/journalRoute";
import {
  storeJournalMedia,
  validateJournalImageFile,
} from "@/lib/journal/mediaStorage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return runJournalRoute(async () => {
    const auth = await requireJournalMember(request);
    if (auth.error) return auth.error;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const validationError = validateJournalImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeJournalMedia(auth.user!.sub, buffer, file.type);
    return NextResponse.json(stored, { status: 201 });
  });
}
