import { NextRequest, NextResponse } from "next/server";
import {
  getMemberProfileAttributes,
  updateMemberProfileAttributes,
} from "@/lib/auth/cognitoAdmin";
import { pickMutableProfileAttributes } from "@/lib/auth/profileAttributeAllowlist";
import { verifyRequest } from "@/lib/auth/verifyRequest";

export const dynamic = "force-dynamic";

type ProfilePatchBody = {
  attributes?: Record<string, string>;
};

export async function GET(request: NextRequest) {
  const user = await verifyRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const attributes = await getMemberProfileAttributes({
      cognitoUsername: user.cognitoUsername ?? user.sub,
      sub: user.sub,
    });
    return NextResponse.json({ attributes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[account/profile] load failed:", error);
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json(
      {
        error:
          status === 404
            ? "User profile not found"
            : "Could not load profile",
      },
      { status }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await verifyRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProfilePatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const attributes = pickMutableProfileAttributes(body.attributes ?? {});
  if (Object.keys(attributes).length === 0) {
    return NextResponse.json(
      { error: "No profile attributes to update" },
      { status: 400 }
    );
  }

  try {
    await updateMemberProfileAttributes({
      cognitoUsername: user.cognitoUsername ?? user.sub,
      sub: user.sub,
      attributes,
    });
    const saved = await getMemberProfileAttributes({
      cognitoUsername: user.cognitoUsername ?? user.sub,
      sub: user.sub,
    });
    return NextResponse.json({ ok: true, attributes: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[account/profile] update failed:", error);
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json(
      {
        error:
          status === 404
            ? "User profile not found"
            : "Could not save profile",
      },
      { status }
    );
  }
}
