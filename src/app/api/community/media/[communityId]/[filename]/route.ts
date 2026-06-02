import { NextRequest, NextResponse } from "next/server";
import { readCommunityPostImage } from "@/lib/community/postImageStorage";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ communityId: string; filename: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { communityId, filename } = await params;
  const file = await readCommunityPostImage(communityId, filename);
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
