import { NextResponse } from "next/server";
import { isManagementUser, verifyRequest } from "@/lib/auth/verifyRequest";
import type { NextRequest } from "next/server";

export const requireManagementAuth = async (request: NextRequest) => {
  const user = await verifyRequest(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }
  if (!isManagementUser(user)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }
  return { error: null, user };
};

export const handleStorageError = (error: unknown) => {
  console.error("Tasks storage error:", error);
  const message =
    error instanceof Error ? error.message : "Storage operation failed";

  if (message.includes("TASKS_S3_BUCKET")) {
    return NextResponse.json(
      { error: "Task storage is not configured on the server" },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Failed to access task storage" }, { status: 500 });
};
