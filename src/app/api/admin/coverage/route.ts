import { NextRequest, NextResponse } from "next/server";
import { handleCoverageStorageError, requireManagementAuth } from "@/lib/api/routeHelpers";
import { loadCoverageConfig, saveCoverageConfig } from "@/lib/coverage/storage";
import type { CoverageConfig } from "@/types/coverage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const { config, meta } = await loadCoverageConfig();
  return NextResponse.json({ ...config, _storage: meta });
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
    return NextResponse.json({
      ...saved,
      _storage: { source: "s3" as const },
    });
  } catch (error) {
    console.error("[admin/coverage] PUT failed:", error);
    return handleCoverageStorageError(error);
  }
}
