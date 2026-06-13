/**
 * Gate before calendar auth deploy (WIF or legacy ADC).
 *
 * Usage:
 *   npm run verify:calendar-deploy
 *
 * WIF mode (production — no expiring user ADC):
 *   GOOGLE_CALENDAR_AUTH_MODE=wif
 *   GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER=...
 *   GOOGLE_WORKLOAD_IDENTITY_POOL_ID=...
 *   GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID=...
 *   Requires AWS credentials for Amplify compute role or server IAM user.
 *
 * Legacy ADC mode (local dev fallback):
 *   GOOGLE_CALENDAR_ADC_JSON_FILE=~/.config/gcloud/legacy_credentials/admin@.../adc.json
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { isGoogleWorkloadIdentityConfigured } from "../src/config/googleWorkloadIdentity";
import { resolveGoogleAdcFile } from "./lib/resolveGoogleAdcFile";
import { verifyCalendarDelegation } from "../src/lib/scheduling/verifyCalendarDelegation";
import {
  validateAdcJsonForDelegatedDeploy,
  validateCalendarDelegatedUserForDeploy,
} from "../src/lib/scheduling/calendarDeployGuards";

const DELEGATED_USER =
  process.env.GOOGLE_CALENDAR_DELEGATED_USER?.trim() ||
  process.env.GOOGLE_TASKS_DELEGATED_USER?.trim() ||
  "admin@nesting-place.com";

const SERVICE_ACCOUNT =
  process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
  "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com";

const AUTH_MODE =
  process.env.GOOGLE_CALENDAR_AUTH_MODE?.trim().toLowerCase() ||
  process.env.GOOGLE_TASKS_AUTH_MODE?.trim().toLowerCase() ||
  "";

const useWif =
  AUTH_MODE === "wif" ||
  (isGoogleWorkloadIdentityConfigured() && AUTH_MODE !== "delegated" && AUTH_MODE !== "adc");

const main = async () => {
  console.log("Verifying Calendar deploy credentials…");
  console.log(`  Auth mode        : ${useWif ? "wif" : "adc"}`);
  console.log(`  Delegated user   : ${DELEGATED_USER}`);
  console.log(`  Service account  : ${SERVICE_ACCOUNT}`);
  if (useWif) {
    console.log(`  WIF pool         : ${process.env.GOOGLE_WORKLOAD_IDENTITY_POOL_ID}`);
    console.log(`  WIF provider     : ${process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID}`);
  } else {
    console.log(`  ADC file         : ${resolveGoogleAdcFile()}`);
  }
  console.log("");

  const userCheck = validateCalendarDelegatedUserForDeploy(DELEGATED_USER);
  if (!userCheck.ok) {
    console.error("FAIL [config]:", userCheck.reason);
    process.exit(1);
  }

  let adcJson: string | undefined;

  if (!useWif) {
    const ADC_FILE = resolveGoogleAdcFile();
    let adcRaw: string;
    try {
      adcRaw = readFileSync(resolve(ADC_FILE), "utf8");
    } catch {
      console.error(`FAIL [adc]: Could not read ADC file: ${ADC_FILE}`);
      console.error("Run: gcloud auth application-default login");
      process.exit(1);
    }

    const adcCheck = validateAdcJsonForDelegatedDeploy(adcRaw);
    if (!adcCheck.ok) {
      console.error("FAIL [adc]:", adcCheck.reason);
      process.exit(1);
    }

    adcJson = adcCheck.adcJson;
    console.log(`OK [adc]: ${adcCheck.credentialType} credentials look structurally valid.`);
  } else if (!isGoogleWorkloadIdentityConfigured()) {
    console.error("FAIL [wif]: GOOGLE_WORKLOAD_IDENTITY_* env vars are incomplete.");
    console.error("Run: ./infrastructure/google/setup-workload-identity-federation.sh");
    process.exit(1);
  } else {
    console.log("OK [wif]: Workload Identity Federation env looks complete.");
  }

  if (process.env.SKIP_CALENDAR_LIVE_TEST === "1") {
    console.log("SKIP [delegation]: live token test skipped (SKIP_CALENDAR_LIVE_TEST=1).");
    process.exit(0);
  }

  const result = await verifyCalendarDelegation({
    delegatedUser: userCheck.email,
    serviceAccount: SERVICE_ACCOUNT,
    adcJson,
  });

  if (!result.ok) {
    console.error(`FAIL [${result.stage}]:`, result.error);
    console.error("Hint:", result.hint);
    process.exit(1);
  }

  console.log(
    `OK [delegation]: Calendar access token received for ${result.delegatedUser} (${result.credentialType}).`
  );
  if (useWif) {
    console.log("WIF auth does not use expiring user ADC — safe for long-running production.");
    console.log("Safe to run: ./infrastructure/aws/scripts/set-amplify-google-wif-env.sh");
  } else {
    console.log(
      "Note: authorized_user credentials expire periodically. Prefer WIF for production."
    );
    console.log("Safe to run: npm run amplify:concierge-scheduling");
  }
};

void main();
