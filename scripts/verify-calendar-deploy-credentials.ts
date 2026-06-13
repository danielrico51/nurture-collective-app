/**
 * Gate before pushing Calendar ADC to Amplify.
 *
 * Usage:
 *   npm run verify:calendar-deploy
 *
 * Optional:
 *   GOOGLE_CALENDAR_ADC_JSON_FILE=~/.config/gcloud/application_default_credentials.json
 *   (default: legacy gcloud user ADC for active account, then application-default)
 *   GOOGLE_CALENDAR_DELEGATED_USER=admin@nesting-place.com
 *   SKIP_CALENDAR_LIVE_TEST=1   # structure/config only (not recommended)
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { resolveGoogleAdcFile } from "./lib/resolveGoogleAdcFile";
import { verifyCalendarDelegation } from "../src/lib/scheduling/verifyCalendarDelegation";
import {
  validateAdcJsonForDelegatedDeploy,
  validateCalendarDelegatedUserForDeploy,
} from "../src/lib/scheduling/calendarDeployGuards";

const ADC_FILE = resolveGoogleAdcFile();

const DELEGATED_USER =
  process.env.GOOGLE_CALENDAR_DELEGATED_USER?.trim() ||
  process.env.GOOGLE_TASKS_DELEGATED_USER?.trim() ||
  "admin@nesting-place.com";

const SERVICE_ACCOUNT =
  process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
  "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com";

const main = async () => {
  console.log("Verifying Calendar deploy credentials…");
  console.log(`  ADC file        : ${ADC_FILE}`);
  console.log(`  Delegated user  : ${DELEGATED_USER}`);
  console.log(`  Service account : ${SERVICE_ACCOUNT}`);
  console.log("");

  const userCheck = validateCalendarDelegatedUserForDeploy(DELEGATED_USER);
  if (!userCheck.ok) {
    console.error("FAIL [config]:", userCheck.reason);
    process.exit(1);
  }

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

  console.log(`OK [adc]: ${adcCheck.credentialType} credentials look structurally valid.`);

  if (process.env.SKIP_CALENDAR_LIVE_TEST === "1") {
    console.log("SKIP [delegation]: live token test skipped (SKIP_CALENDAR_LIVE_TEST=1).");
    process.exit(0);
  }

  const result = await verifyCalendarDelegation({
    delegatedUser: userCheck.email,
    serviceAccount: SERVICE_ACCOUNT,
    adcJson: adcCheck.adcJson,
  });

  if (!result.ok) {
    console.error(`FAIL [${result.stage}]:`, result.error);
    console.error("Hint:", result.hint);
    process.exit(1);
  }

  console.log(
    `OK [delegation]: Calendar access token received for ${result.delegatedUser} (${result.credentialType}).`
  );
  console.log(
    "Note: authorized_user credentials expire periodically. Re-run this check before /book breaks in prod."
  );
  console.log("Safe to run: npm run amplify:concierge-scheduling");
};

void main();
