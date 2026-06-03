import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl, isMediaS3Enabled } from "@/lib/aws/s3Objects";
import {
  ALLOWED_POST_IMAGE_TYPES,
  buildPostImageObject,
} from "@/lib/community/postImageStorage";
import { requireMemberAuth } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

/**
 * Presigned S3 PUT for post images — keeps large bodies off Amplify SSR/CDN.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  const { id: communityId } = await params;

  let body: { contentType?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const contentType =
    typeof body.contentType === "string" ? body.contentType : "";
  if (!ALLOWED_POST_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }

  if (!isMediaS3Enabled()) {
    return NextResponse.json(
      { error: "Direct upload is not available in this environment." },
      { status: 409 }
    );
  }

  try {
    const { key, url, filename } = buildPostImageObject(communityId, contentType);
    const uploadUrl = await createPresignedUploadUrl(key, contentType, 120);
    return NextResponse.json({ uploadUrl, key, url, filename }, { status: 200 });
  } catch (error) {
    console.error("Post image presign error:", error);
    return NextResponse.json(
      { error: "Could not prepare the upload. Please try again." },
      { status: 500 }
    );
  }
}
