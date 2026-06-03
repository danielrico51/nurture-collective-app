import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_JOURNAL_IMAGE_TYPES,
  buildJournalMediaObject,
} from "@/lib/journal/mediaStorage";
import { createPresignedUploadUrl, isMediaS3Enabled } from "@/lib/aws/s3Objects";
import { requireJournalMember } from "@/lib/api/journalAuth";
import { runJournalRoute } from "@/lib/api/journalRoute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return runJournalRoute(async () => {
    const auth = await requireJournalMember(request);
    if (auth.error) return auth.error;

    let body: { contentType?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const contentType =
      typeof body.contentType === "string" ? body.contentType : "";
    if (!(ALLOWED_JOURNAL_IMAGE_TYPES as readonly string[]).includes(contentType)) {
      return NextResponse.json(
        { error: "Use JPEG, PNG, or WebP for timeline photos." },
        { status: 400 }
      );
    }

    if (!isMediaS3Enabled()) {
      return NextResponse.json(
        { error: "Use direct upload in local mode." },
        { status: 409 }
      );
    }

    const { key, url } = buildJournalMediaObject(auth.user!.sub, contentType);
    const uploadUrl = await createPresignedUploadUrl(key, contentType, 120);
    return NextResponse.json({ uploadUrl, key, url });
  });
}
