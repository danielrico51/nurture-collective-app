import { existsSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
import { execSync } from "child_process";

const DEFAULT_ADC = resolve(
  homedir(),
  ".config/gcloud/application_default_credentials.json"
);

const activeGcloudAccount = (): string | null => {
  try {
    const account = execSync("gcloud config get-value account", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return account && account !== "(unset)" ? account : null;
  } catch {
    return null;
  }
};

const legacyAdcForAccount = (account: string): string =>
  resolve(homedir(), `.config/gcloud/legacy_credentials/${account}/adc.json`);

/** Prefer explicit env path, then gcloud legacy user ADC, then application-default. */
export const resolveGoogleAdcFile = (): string => {
  const fromEnv =
    process.env.GOOGLE_CALENDAR_ADC_JSON_FILE?.trim() ||
    process.env.GOOGLE_TASKS_ADC_JSON_FILE?.trim();
  if (fromEnv) return resolve(fromEnv);

  const account = activeGcloudAccount();
  if (account) {
    const legacy = legacyAdcForAccount(account);
    if (existsSync(legacy)) return legacy;
  }

  return DEFAULT_ADC;
};
