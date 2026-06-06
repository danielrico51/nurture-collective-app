/**
 * Clear stale googleTaskId links and re-migrate to the user's visible Tasks list.
 *
 *   npm run reset:migrate:google-tasks
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
  const { clearGoogleTaskIds, migrateInternalTasksToGoogle } = await import(
    "../src/lib/tasks/googleSync"
  );
  const { serverGoogleTasksConfig } = await import("../src/config/googleTasks");

  console.log("Auth mode:", serverGoogleTasksConfig.authMode);
  console.log("Delegated user:", serverGoogleTasksConfig.delegatedUser);

  const cleared = await clearGoogleTaskIds();
  console.log("Cleared googleTaskId on", cleared, "tasks");

  const migrate = await migrateInternalTasksToGoogle();
  console.log("Migrated", migrate.migrated, "tasks; skipped", migrate.skipped);
  if (migrate.errors.length) {
    console.error("Errors:");
    migrate.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log("");
  console.log("Open https://tasks.google.com as", serverGoogleTasksConfig.delegatedUser);
  console.log('Look for list:', serverGoogleTasksConfig.taskListTitle);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
