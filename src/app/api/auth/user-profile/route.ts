import { NextRequest, NextResponse } from "next/server";
import { getProfileForPasswordChallenge } from "@/lib/auth/cognitoAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const { existing, missing } = await getProfileForPasswordChallenge(username);
    return NextResponse.json({ attributes: existing, missing });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("User profile lookup error:", error);
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json(
      {
        error:
          status === 404
            ? "User profile not found"
            : "Could not load user profile",
      },
      { status }
    );
  }
}
