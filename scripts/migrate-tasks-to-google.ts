/**
 * One-time migration: push internal tasks from S3/local storage to Google Tasks.
 *
 * @see docs/platform/google-tasks-sync.md
 *
 * Usage:
 *   npm run migrate:tasks-to-google
 *   DRY_RUN=true npm run migrate:tasks-to-google
 *   ACTION=pull npm run migrate:tasks-to-google
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const main = async () => {
  const { migrateInternalTasksToGoogle, pullInternalTasksFromGoogle } =
    await import("../src/lib/tasks/googleSync");

  const dryRun = process.env.DRY_RUN?.trim().toLowerCase() === "true";
  const action = (process.env.ACTION?.trim().toLowerCase() || "migrate") as
    | "migrate"
    | "pull"
    | "both";

  if (action === "migrate" || action === "both") {
    const migrate = await migrateInternalTasksToGoogle({ dryRun });
    console.log(
      dryRun ? "[dry-run] would migrate" : "Migrated",
      migrate.migrated,
      "tasks; skipped",
      migrate.skipped
    );
    if (migrate.errors.length) {
      console.error("Errors:");
      migrate.errors.forEach((error) => console.error(`  - ${error}`));
    }
  }

  if (!dryRun && (action === "pull" || action === "both")) {
    const pull = await pullInternalTasksFromGoogle();
    console.log("Pulled", pull.pulled, "updates; linked", pull.linked);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
