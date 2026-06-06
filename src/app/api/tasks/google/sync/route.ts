import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  getGoogleTasksStatus,
  migrateInternalTasksToGoogle,
  pullInternalTasksFromGoogle,
} from "@/lib/tasks/googleSync";

export const dynamic = "force-dynamic";

type SyncBody = {
  action?: "pull" | "migrate" | "both";
  dryRun?: boolean;
};

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  return NextResponse.json({ googleTasks: getGoogleTasksStatus() });
}

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: SyncBody = {};
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    body = {};
  }

  const action = body.action ?? "both";
  const dryRun = body.dryRun ?? false;

  try {
    const result: Record<string, unknown> = {
      googleTasks: getGoogleTasksStatus(),
    };

    if (action === "migrate" || action === "both") {
      result.migrate = await migrateInternalTasksToGoogle(
        { dryRun },
        auth.user!.email
      );
    }
    if (action === "pull" || action === "both") {
      if (!dryRun) {
        result.pull = await pullInternalTasksFromGoogle(auth.user!.email);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleStorageError(error);
  }
}
