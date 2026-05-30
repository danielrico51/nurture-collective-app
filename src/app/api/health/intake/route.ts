import { NextResponse } from "next/server";
import { getIntakeHealth } from "@/lib/intake/submitService";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getIntakeHealth();
  const statusCode = health.status === "unhealthy" ? 503 : 200;
  return NextResponse.json(
    {
      status: health.status === "healthy" ? "healthy" : health.status,
      n8n: health.n8n,
      storage: health.storage,
    },
    { status: statusCode }
  );
}
