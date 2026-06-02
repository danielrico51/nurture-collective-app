import { NextRequest, NextResponse } from "next/server";
import {
  storeProfileAvatar,
  validateAvatarImageFile,
} from "@/lib/account/profileAvatarStorage";
import { proxyCommunityRequest, readCommunityJson } from "@/lib/community/proxy";
import {
  handleCommunityProxyError,
  requireMemberAuth,
} from "@/lib/community/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const validationError = validateAvatarImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeProfileAvatar(auth.user!.sub, buffer, file.type);

    const communityResponse = await proxyCommunityRequest(
      auth.authorizationHeader!,
      "/api/v1/users/me/",
      {
        method: "PATCH",
        body: JSON.stringify({ avatar_url: stored.url }),
      }
    );
    const { status, data } = await readCommunityJson(communityResponse);
    if (status >= 400) {
      return NextResponse.json(
        {
          error:
            typeof data.error === "string"
              ? data.error
              : "Photo uploaded but profile sync failed",
        },
        { status }
      );
    }

    return NextResponse.json(
      { url: stored.url, profile: data },
      { status: 201 }
    );
  } catch (error) {
    return handleCommunityProxyError(error);
  }
}
