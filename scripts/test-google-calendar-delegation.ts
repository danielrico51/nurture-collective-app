/**
 * Diagnose domain-wide delegation for concierge Calendar scheduling.
 *
 * Usage:
 *   npx tsx scripts/test-google-calendar-delegation.ts
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *   Workspace domain-wide delegation for nurture-tasks-sync client ID + calendar scope
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createDelegatedGoogleAuthClient } from "../src/lib/integrations/google/delegatedAuth";

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

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const serviceAccount =
  process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
  "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com";
const delegatedUser =
  process.env.GOOGLE_CALENDAR_DELEGATED_USER?.trim() ||
  process.env.GOOGLE_TASKS_DELEGATED_USER?.trim() ||
  "info@nesting-place.com";
const adcJson =
  process.env.GOOGLE_CALENDAR_ADC_JSON?.trim() ||
  process.env.GOOGLE_TASKS_ADC_JSON?.trim() ||
  "";

const main = async () => {
  console.log("Testing Google Calendar domain-wide delegation…");
  console.log(`  Service account : ${serviceAccount}`);
  console.log(`  Delegated user  : ${delegatedUser}`);
  console.log(`  ADC source      : ${adcJson ? "env JSON" : "gcloud application-default"}`);
  console.log(`  Scope           : ${CALENDAR_SCOPE}`);
  console.log("");

  try {
    const client = await createDelegatedGoogleAuthClient({
      scope: CALENDAR_SCOPE,
      subject: delegatedUser,
      serviceAccount,
      adcJson: adcJson || undefined,
    });
    const token = client.credentials.access_token;
    if (!token) {
      console.error("FAIL: No access token returned.");
      process.exit(1);
    }
    console.log("OK: Received Calendar access token via domain-wide delegation.");
    console.log(
      "Next: redeploy Amplify if this passed locally but dev still fails (stale ADC in env)."
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FAIL:", message);
    console.error("");
    console.error("Checklist:");
    console.error(
      "  1. GCP Console → IAM → Service Accounts → nurture-tasks-sync → enable"
    );
    console.error(
      "     'Google Workspace Domain-wide Delegation' (checkbox on the SA itself)."
    );
    console.error(
      "  2. Workspace Admin → Domain-wide delegation → client ID must match GCP"
    );
    console.error(
      "     Client ID shown on the service account (often same as 104446812720989008018)."
    );
    console.error(
      "  3. Scopes (comma-separated, two separate URLs):"
    );
    console.error("       https://www.googleapis.com/auth/tasks");
    console.error("       https://www.googleapis.com/auth/calendar");
    console.error(
      `  4. Delegated user ${delegatedUser} must be a real Workspace mailbox.`
    );
    process.exit(1);
  }
};

main();
