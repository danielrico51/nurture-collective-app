import { readFileSync } from "fs";
import { resolveGoogleAdcFile } from "./resolveGoogleAdcFile";
import { validateAdcJsonForDelegatedDeploy } from "../../src/lib/scheduling/calendarDeployGuards";

/** Prepare env for CLI scripts that use domain-wide delegation (same as Calendar). */
export const bootstrapGoogleCliEnv = (): { adcFile?: string; credentialType?: string } => {
  process.env.GOOGLE_CALENDAR_AUTH_MODE =
    process.env.GOOGLE_CALENDAR_AUTH_MODE?.trim() || "delegated";
  process.env.GOOGLE_CALENDAR_DELEGATED_USER =
    process.env.GOOGLE_CALENDAR_DELEGATED_USER?.trim() ||
    process.env.GOOGLE_TASKS_DELEGATED_USER?.trim() ||
    "admin@nesting-place.com";
  process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT =
    process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
    "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com";

  if (process.env.GOOGLE_CALENDAR_ADC_JSON?.trim()) {
    return { credentialType: "env_json" };
  }

  const adcFile = resolveGoogleAdcFile();
  try {
    const raw = readFileSync(adcFile, "utf8");
    const check = validateAdcJsonForDelegatedDeploy(raw);
    if (check.ok) {
      process.env.GOOGLE_CALENDAR_ADC_JSON = check.adcJson;
      return { adcFile, credentialType: check.credentialType };
    }
  } catch {
    /* fall through */
  }

  return { adcFile };
};

export const formatGoogleCliAuthHint = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("invalid_rapt") || lower.includes("invalid_grant")) {
    return [
      "Your local Google credentials expired (invalid_rapt) — delegation scopes are OK.",
      "",
      "Fix option A — refresh gcloud ADC (run as admin@nesting-place.com):",
      "  gcloud auth login admin@nesting-place.com",
      "  gcloud auth application-default login",
      "  npm run setup:proposal-google-template",
      "",
      "Fix option B — use AWS + WIF (no local gcloud token):",
      "  export SERVER_AWS_ACCESS_KEY_ID=... SERVER_AWS_SECRET_ACCESS_KEY=...",
      "  GOOGLE_CALENDAR_AUTH_MODE=wif npm run setup:proposal-google-template",
      "",
      "Fix option C — skip API create; make the Doc manually in Google Docs,",
      "  copy the ID from the URL, then:",
      "  GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<id> AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-proposals-env.sh",
    ].join("\n");
  }

  if (
    lower.includes("unauthorized_client") ||
    lower.includes("domain-wide delegation") ||
    lower.includes("not authorized for any of the scopes")
  ) {
    return [
      "Workspace domain-wide delegation may be missing Docs/Drive scopes.",
      "Add for nurture-tasks-sync client ID:",
      "  https://www.googleapis.com/auth/documents",
      "  https://www.googleapis.com/auth/drive",
    ].join("\n");
  }

  return "Check GOOGLE_CALENDAR_DELEGATED_USER=admin@nesting-place.com and ADC/WIF credentials.";
};
