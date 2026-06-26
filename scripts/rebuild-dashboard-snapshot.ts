/**
 * Rebuild the precomputed dashboard snapshot in CRM storage.
 *
 * Usage:
 *   APP_ENV=dev CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=... \
 *     npm run rebuild:dashboard-snapshot
 */
import { clientsCrmStorageConfig } from "../src/lib/clients/config";
import { rebuildDashboardSnapshot } from "../src/lib/dashboard/snapshot";

const parseArgs = () => ({
  force: process.argv.includes("--force"),
});

const main = async () => {
  const { force } = parseArgs();
  const { deploymentEnvironment, s3Prefix, useLocalStorage, localDataRoot } =
    clientsCrmStorageConfig;
  const target = useLocalStorage ? localDataRoot : `s3://${s3Prefix}`;

  console.log(`Dashboard snapshot rebuild — scope: ${deploymentEnvironment} (${target})`);

  const { key, snapshot } = await rebuildDashboardSnapshot({ force });
  console.log(`Wrote ${key}`);
  console.log(
    `Engagements: ${snapshot.engagementAnalytics.summary.totalEngagements}, rows: ${snapshot.engagementRows.length}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
