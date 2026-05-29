import { NextResponse } from "next/server";
import { loadCoverageConfig } from "@/lib/coverage/storage";

export const dynamic = "force-dynamic";

/** Public read-only coverage config for marketing pages and concierge. */
export async function GET() {
  const { config } = await loadCoverageConfig();
  return NextResponse.json(config);
}
