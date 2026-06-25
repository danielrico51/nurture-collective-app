import { NextResponse } from "next/server";
import {
  isGoogleSchedulingActive,
  isGoogleSchedulingConfigured,
  serverSchedulingConfig,
} from "@/lib/scheduling/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    enabled: isGoogleSchedulingActive(),
    configured: isGoogleSchedulingConfigured(),
    timezone: serverSchedulingConfig.timezone,
    durationMinutes: serverSchedulingConfig.durationMinutes,
    workHoursStart: serverSchedulingConfig.workHoursStart,
    workHoursEnd: serverSchedulingConfig.workHoursEnd,
    workDays: serverSchedulingConfig.workDays,
  });
}
