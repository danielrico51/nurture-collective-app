import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  getGoogleTasksConnection,
  removeGoogleTasksConnection,
} from "@/lib/tasks/googleConnectionsStorage";
import { isPersonalGoogleTasksSync } from "@/config/googleTasks";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const connection = await getGoogleTasksConnection(auth.user!.email);
    return NextResponse.json({
      personalSync: isPersonalGoogleTasksSync(),
      connected: Boolean(connection),
      email: connection?.email ?? auth.user!.email,
      syncAllTasks: connection?.syncAllTasks ?? true,
      connectedAt: connection?.connectedAt ?? null,
      taskListId: connection?.taskListId ?? null,
    });
  } catch (error) {
    return handleStorageError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const removed = await removeGoogleTasksConnection(auth.user!.email);
    return NextResponse.json({ ok: true, removed });
  } catch (error) {
    return handleStorageError(error);
  }
}
