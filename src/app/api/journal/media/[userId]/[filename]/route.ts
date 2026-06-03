import { NextRequest, NextResponse } from "next/server";
import { readJournalMedia } from "@/lib/journal/mediaStorage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ userId: string; filename: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { userId, filename } = await params;
  const file = await readJournalMedia(decodeURIComponent(userId), filename);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
