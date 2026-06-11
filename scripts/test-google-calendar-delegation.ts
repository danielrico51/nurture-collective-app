/**
 * Diagnose domain-wide delegation for concierge Calendar scheduling.
 *
 * Usage:
 *   npm run test:calendar-delegation
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *   Workspace domain-wide delegation for nurture-tasks-sync client ID + calendar scope
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { verifyCalendarDelegation } from "../src/lib/scheduling/verifyCalendarDelegation";

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

const ADC_FILE =
  process.env.GOOGLE_CALENDAR_ADC_JSON_FILE?.trim() ||
  process.env.GOOGLE_TASKS_ADC_JSON_FILE?.trim() ||
  `${process.env.HOME}/.config/gcloud/application_default_credentials.json`;

const serviceAccount =
  process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
  "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com";
const delegatedUser =
  process.env.GOOGLE_CALENDAR_DELEGATED_USER?.trim() ||
  process.env.GOOGLE_TASKS_DELEGATED_USER?.trim() ||
  "admin@nesting-place.com";
const adcJsonFromEnv =
  process.env.GOOGLE_CALENDAR_ADC_JSON?.trim() ||
  process.env.GOOGLE_TASKS_ADC_JSON?.trim() ||
  "";

const main = async () => {
  console.log("Testing Google Calendar domain-wide delegation…");

  const adcJson =
    adcJsonFromEnv ||
    readFileSync(resolve(ADC_FILE), "utf8");

  console.log(`  Service account : ${serviceAccount}`);
  console.log(`  Delegated user  : ${delegatedUser}`);
  console.log(
    `  ADC source      : ${adcJsonFromEnv ? "env JSON" : ADC_FILE}`
  );
  console.log("");

  const result = await verifyCalendarDelegation({
    delegatedUser,
    serviceAccount,
    adcJson,
  });

  if (!result.ok) {
    console.error(`FAIL [${result.stage}]:`, result.error);
    console.error("Hint:", result.hint);
    process.exit(1);
  }

  console.log(
    `OK: Received Calendar access token for ${result.delegatedUser} (${result.credentialType}).`
  );
};

void main();
