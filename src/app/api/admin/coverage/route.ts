import { NextRequest, NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import { getCoverageConfig, saveCoverageConfig } from "@/lib/coverage/storage";
import type { CoverageConfig } from "@/types/coverage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const config = await getCoverageConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("[admin/coverage] GET failed:", error);
    return NextResponse.json({ error: "Could not load coverage" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: CoverageConfig;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.regions?.length) {
    return NextResponse.json({ error: "At least one region is required" }, { status: 400 });
  }

  try {
    const saved = await saveCoverageConfig(body, auth.user.email ?? auth.user.sub);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[admin/coverage] PUT failed:", error);
    return NextResponse.json({ error: "Could not save coverage" }, { status: 500 });
  }
}
