/**
 * Debug: list Google Task lists for current auth mode.
 *   npm run list:google-tasks
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
  const { getOrCreateTaskListId, listGoogleTasks } = await import(
    "../src/lib/integrations/google/tasksClient"
  );
  const { serverGoogleTasksConfig } = await import("../src/config/googleTasks");

  console.log("Auth mode:", serverGoogleTasksConfig.authMode);
  console.log("List title:", serverGoogleTasksConfig.taskListTitle);

  const listId = await getOrCreateTaskListId();
  console.log("Task list id:", listId);

  const tasks = await listGoogleTasks(listId);
  console.log("Tasks in list:", tasks.length);
  tasks.slice(0, 5).forEach((task) => {
    console.log(`  - ${task.status} | ${task.title}`);
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
