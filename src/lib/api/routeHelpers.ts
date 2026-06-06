import { NextResponse } from "next/server";
import { isManagementUser, verifyRequest } from "@/lib/auth/verifyRequest";
import {
  formatGoogleTasksError,
  isGoogleTasksErrorMessage,
} from "@/lib/tasks/googleSyncFeedback";
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

  if (isGoogleTasksErrorMessage(message)) {
    return NextResponse.json(
      { error: formatGoogleTasksError(message) },
      { status: 503 }
    );
  }

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
    const bucket = process.env.NURTURE_LEADS_BUCKET?.trim() || "nurture-leads-*";
    const usingStaticKeys = Boolean(
      process.env.SERVER_AWS_ACCESS_KEY_ID?.trim() ||
        process.env.AMPLIFY_AWS_ACCESS_KEY_ID?.trim()
    );
    return NextResponse.json(
      {
        error:
          `Lead storage access denied for bucket "${bucket}". ` +
          (usingStaticKeys
            ? "SERVER_AWS_ACCESS_KEY_ID is set — attach s3:ListBucket, s3:GetObject, s3:PutObject, and s3:DeleteObject on that bucket to the IAM user, or remove those keys so the Amplify compute role is used."
            : "Attach the NurtureAmplifyPlatformS3 policy to your Amplify compute role (see infrastructure/aws/scripts/attach-amplify-s3-policy.sh).") +
          " Confirm NURTURE_LEADS_BUCKET matches the CloudFormation LeadsBucketName output, then redeploy Amplify.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Failed to access lead storage" }, { status: 500 });
};

export const handleBlogStorageError = (error: unknown) => {
  console.error("[blog] storage error:", error);
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
          "Blog storage access denied. Grant s3:GetObject and s3:PutObject on management/blog/* in the tasks bucket.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Failed to access blog storage" }, { status: 500 });
};

export const handleCoverageStorageError = (error: unknown) => {
  console.error("[coverage] storage error:", error);
  const message =
    error instanceof Error ? error.message : "Storage operation failed";
  const bucket =
    process.env.INTAKE_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    "nurture-collective-tasks";
  const usingStaticKeys = Boolean(
    process.env.SERVER_AWS_ACCESS_KEY_ID?.trim() ||
      process.env.AMPLIFY_AWS_ACCESS_KEY_ID?.trim()
  );

  if (
    message.includes("AccessDenied") ||
    message.includes("not authorized") ||
    message.includes("Access Denied")
  ) {
    return NextResponse.json(
      {
        error:
          `Coverage storage access denied for s3://${bucket}/platform/coverage/*. ` +
          (usingStaticKeys
            ? "Attach s3:GetObject and s3:PutObject on that path to the IAM user behind SERVER_AWS_ACCESS_KEY_ID (see infrastructure/aws/policies/nurture-collective-amplify-compute-policy.json), or remove those keys to use the Amplify compute role."
            : "Attach the Amplify compute policy with platform/coverage access (see infrastructure/aws/scripts/attach-amplify-s3-policy.sh)."),
      },
      { status: 503 }
    );
  }

  if (message.includes("TASKS_S3_BUCKET") || message.includes("INTAKE_S3_BUCKET")) {
    return NextResponse.json(
      {
        error:
          "Coverage storage is not configured. Set TASKS_S3_BUCKET or INTAKE_S3_BUCKET in Amplify environment variables.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Failed to access coverage storage" }, { status: 500 });
};

export const handleEventsStorageError = (error: unknown) => {
  console.error("[events] storage error:", error);
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
          "Events storage access denied. Grant s3:GetObject and s3:PutObject on management/events/* in the tasks bucket.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Failed to access events storage" }, { status: 500 });
};

export const handleJournalStorageError = (error: unknown) => {
  console.error("[journal] storage error:", error);
  const message =
    error instanceof Error ? error.message : "Storage operation failed";
  const bucket =
    process.env.JOURNAL_S3_BUCKET?.trim() ||
    process.env.INTAKE_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    "nurture-collective-tasks";
  const usingStaticKeys = Boolean(
    process.env.SERVER_AWS_ACCESS_KEY_ID?.trim() ||
      process.env.AMPLIFY_AWS_ACCESS_KEY_ID?.trim()
  );

  if (message.includes("Cognito environment variables are not configured")) {
    return NextResponse.json(
      { error: "Sign-in is not configured on this environment." },
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
          `Journal storage access denied for s3://${bucket}/management/process=journal/*. ` +
          (usingStaticKeys
            ? "Attach s3:GetObject, s3:PutObject, and s3:DeleteObject on that prefix to the IAM user behind SERVER_AWS_ACCESS_KEY_ID, or remove those keys so the Amplify compute role is used."
            : "Attach the Amplify compute policy with tasks-bucket access (see infrastructure/aws/scripts/attach-amplify-s3-policy.sh), then redeploy."),
      },
      { status: 503 }
    );
  }

  if (message.includes("EROFS") || message.includes("read-only file system")) {
    return NextResponse.json(
      {
        error:
          "Journal cannot write to local disk in this environment. Set TASKS_S3_BUCKET (or INTAKE_S3_BUCKET) in Amplify and redeploy.",
      },
      { status: 503 }
    );
  }

  if (
    message.includes("Could not load credentials") ||
    message.includes("CredentialsProviderError") ||
    message.includes("credential")
  ) {
    return NextResponse.json(
      {
        error:
          "Journal storage credentials are missing on the server. Remove SERVER_AWS_ACCESS_KEY_ID from Amplify if set (use the compute role), or attach S3 permissions to the configured IAM user, then redeploy.",
      },
      { status: 503 }
    );
  }

  if (message.includes("Journal S3 PutObject failed")) {
    return NextResponse.json({ error: message.slice(0, 500) }, { status: 503 });
  }

  return NextResponse.json(
    {
      error:
        process.env.NODE_ENV === "development" && message
          ? `Journal save failed: ${message}`
          : "Could not save your journal entry. Please try again.",
    },
    { status: 500 }
  );
};
