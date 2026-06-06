import type { ManagementTask } from "@/types/task";

export interface GoogleMigrateResult {
  migrated: number;
  skipped: number;
  errors: string[];
}

export interface GooglePullResult {
  pulled: number;
  linked: number;
  skipped: number;
}

export const isGoogleTasksErrorMessage = (message: string): boolean => {
  const lower = message.toLowerCase();
  return (
    lower.includes("google tasks") ||
    lower.includes("googleapis") ||
    lower.includes("domain-wide delegation") ||
    lower.includes("connect google tasks") ||
    lower.includes("google_tasks") ||
    lower.includes("signjwt") ||
    lower.includes("iamcredentials") ||
    lower.includes("invalid_grant") ||
    lower.includes("unauthorized_client") ||
    lower.includes("tasks/v1") ||
    lower.includes("oauth") ||
    lower.includes("delegation failed") ||
    lower.includes("gaxios") ||
    lower.includes("request failed with status code 4")
  );
};

export const formatGoogleTasksError = (error: unknown): string => {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  if (message.includes("Domain-wide delegation")) {
    return message;
  }
  if (message.includes("Connect Google Tasks")) {
    return message;
  }
  if (isGoogleTasksErrorMessage(message)) {
    return `Google Tasks sync failed: ${message}`;
  }
  return message;
};

export const getGooglePushEligibility = (tasks: ManagementTask[]) => {
  let eligible = 0;
  let alreadyLinked = 0;
  let clientTasks = 0;

  for (const task of tasks) {
    if (task.category !== "internal") {
      clientTasks += 1;
      continue;
    }
    if (task.googleTaskId) {
      alreadyLinked += 1;
      continue;
    }
    eligible += 1;
  }

  return { eligible, alreadyLinked, clientTasks };
};

export const describePushSyncResult = (
  migrate: GoogleMigrateResult | undefined,
  eligibility: ReturnType<typeof getGooglePushEligibility>
): { tone: "success" | "error" | "info"; message: string } => {
  const errors = migrate?.errors ?? [];
  if (errors.length > 0) {
    const preview = errors.slice(0, 2).join(" ");
    const suffix =
      errors.length > 2 ? ` (+${errors.length - 2} more in server logs)` : "";
    return {
      tone: "error",
      message: `Push finished with ${errors.length} error(s). ${preview}${suffix}`,
    };
  }

  const migrated = migrate?.migrated ?? 0;
  if (migrated > 0) {
    return {
      tone: "success",
      message: `Pushed ${migrated} internal task${migrated === 1 ? "" : "s"} to Google Tasks.`,
    };
  }

  if (eligibility.eligible > 0) {
    return {
      tone: "info",
      message:
        "No tasks were pushed. Check Amplify Google Tasks credentials and try again.",
    };
  }

  const parts: string[] = [];
  if (eligibility.alreadyLinked > 0) {
    parts.push(
      `${eligibility.alreadyLinked} already linked to Google`
    );
  }
  if (eligibility.clientTasks > 0) {
    parts.push(`${eligibility.clientTasks} client tasks (ClickUp only)`);
  }

  return {
    tone: "info",
    message:
      parts.length > 0
        ? `Nothing to push — ${parts.join(", ")}. Only unlinked internal tasks sync to Google.`
        : "Nothing to push — create an internal task first.",
  };
};

export const describePullSyncResult = (
  pull: GooglePullResult | undefined
): { tone: "success" | "info"; message: string } => {
  const pulled = pull?.pulled ?? 0;
  const linked = pull?.linked ?? 0;
  const skipped = pull?.skipped ?? 0;

  if (pulled > 0 || linked > 0) {
    return {
      tone: "success",
      message: `Synced from Google (${pulled} updated, ${linked} newly linked).`,
    };
  }

  if (skipped > 0) {
    return {
      tone: "info",
      message: `No app tasks updated — ${skipped} Google item${skipped === 1 ? "" : "s"} skipped (not linked internal tasks).`,
    };
  }

  return {
    tone: "info",
    message: "No updates from Google Tasks.",
  };
};

export const googleTasksDestinationHint = (options: {
  personalSync: boolean;
  delegatedUser?: string | null;
  taskListTitle?: string | null;
  connected?: boolean;
}): string | null => {
  if (!options.personalSync && options.delegatedUser) {
    return `Internal tasks sync to ${options.delegatedUser} → list “${options.taskListTitle ?? "Nesting Place Tasks"}”. Open tasks.google.com signed in as that account.`;
  }
  if (options.personalSync && options.connected) {
    return `Tasks mirror to your personal Google Tasks list “${options.taskListTitle ?? "Nesting Place Tasks"}”.`;
  }
  if (options.personalSync) {
    return "Connect Google Tasks to mirror internal tasks to your personal Google account.";
  }
  return null;
};
