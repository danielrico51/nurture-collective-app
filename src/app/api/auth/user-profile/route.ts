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
    console.error("User profile lookup error:", error);
    return NextResponse.json(
      { error: "Could not load user profile" },
      { status: 500 }
    );
  }
}
