import { NextRequest, NextResponse } from "next/server";
import { getClassRegistrationAdminSettings } from "@/lib/classRegistrations/adminSettings";
import { requireManagementAuth } from "@/lib/api/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  return NextResponse.json({
    settings: getClassRegistrationAdminSettings(),
  });
}
