import { NextRequest, NextResponse } from "next/server";
import {
  handleIntakeStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listAllIntakes } from "@/lib/intake/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const data = await listAllIntakes();
    return NextResponse.json(data);
  } catch (error) {
    return handleIntakeStorageError(error);
  }
}
