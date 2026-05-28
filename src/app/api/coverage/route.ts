import { NextResponse } from "next/server";
import { getCoverageConfig } from "@/lib/coverage/storage";

export const dynamic = "force-dynamic";

/** Public read-only coverage config for marketing pages and concierge. */
export async function GET() {
  try {
    const config = await getCoverageConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("[coverage] GET failed:", error);
    return NextResponse.json({ error: "Could not load coverage" }, { status: 500 });
  }
}
