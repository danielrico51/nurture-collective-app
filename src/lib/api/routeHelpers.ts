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
      {
        error:
          "Task storage is not configured. Set TASKS_S3_BUCKET in Amplify environment variables and redeploy.",
      },
      { status: 503 }
    );
  }

  if (
    message.includes("AccessDenied") ||
    message.includes("not authorized") ||
    message.includes("Access Denied")
  ) {
    return NextResponse.json(
      {
        error:
          "Task storage access denied. Grant the Amplify compute role s3:GetObject and s3:PutObject on the tasks bucket.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Failed to access task storage" }, { status: 500 });
};

export const handleIntakeStorageError = (error: unknown) => {
  console.error("[intake] storage error:", error);
  const message =
    error instanceof Error ? error.message : "Storage operation failed";

  if (
    message.includes("AccessDenied") ||
    message.includes("not authorized") ||
    message.includes("Access Denied")
  ) {
    return NextResponse.json(
      {
        error:
          "Intake storage access denied. Grant the Amplify compute role s3:ListBucket (prefix management/process=intake/), s3:GetObject, s3:PutObject, and s3:DeleteObject on the intake bucket.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "Failed to access intake storage" },
    { status: 500 }
  );
};

export const handleLeadsStorageError = (error: unknown) => {
  console.error("[leads] storage error:", error);
  const message =
    error instanceof Error ? error.message : "Storage operation failed";

  if (message.includes("NURTURE_LEADS_BUCKET")) {
    return NextResponse.json(
      {
        error:
          "Lead CRM storage is not configured. Set NURTURE_LEADS_BUCKET in environment variables.",
      },
      { status: 503 }
    );
  }

  if (
    message.includes("AccessDenied") ||
    message.includes("not authorized") ||
    message.includes("Access Denied")
  ) {
    return NextResponse.json(
      {
        error:
          "Lead storage access denied. Grant s3:ListBucket, s3:GetObject, and s3:PutObject on the nurture-leads bucket.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Failed to access lead storage" }, { status: 500 });
};
