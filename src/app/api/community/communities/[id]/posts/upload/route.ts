import { NextRequest, NextResponse } from "next/server";
import {
  requireMemberAuth,
  handleCommunityProxyError,
} from "@/lib/community/routeHelpers";
import {
  storeCommunityPostImage,
  validatePostImageFile,
} from "@/lib/community/postImageStorage";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  const { id: communityId } = await params;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const validationError = validatePostImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeCommunityPostImage(
      communityId,
      buffer,
      file.type
    );

    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    return handleCommunityProxyError(error);
  }
}
