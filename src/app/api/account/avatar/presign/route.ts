import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_AVATAR_IMAGE_TYPES,
  buildAvatarObject,
} from "@/lib/account/profileAvatarStorage";
import { createPresignedUploadUrl, isMediaS3Enabled } from "@/lib/aws/s3Objects";
import { requireMemberAuth } from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

/**
 * Returns a presigned S3 PUT URL so the browser can upload the avatar
 * directly to S3. This keeps the (large) image bytes off the Amplify
 * CDN/SSR path, which rejects sizable multipart request bodies.
 */
export async function POST(request: NextRequest) {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  let body: { contentType?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const contentType =
    typeof body.contentType === "string" ? body.contentType : "";
  if (!ALLOWED_AVATAR_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, or WebP for your profile photo." },
      { status: 400 }
    );
  }

  // Local dev (no bucket configured) uses the legacy filesystem upload route.
  if (!isMediaS3Enabled()) {
    return NextResponse.json(
      { error: "Direct upload is not available in this environment." },
      { status: 409 }
    );
  }

  try {
    const { key, url } = buildAvatarObject(auth.user!.sub, contentType);
    const uploadUrl = await createPresignedUploadUrl(key, contentType, 120);
    return NextResponse.json({ uploadUrl, key, url }, { status: 200 });
  } catch (error) {
    console.error("Avatar presign error:", error);
    return NextResponse.json(
      { error: "Could not prepare the upload. Please try again." },
      { status: 500 }
    );
  }
}
