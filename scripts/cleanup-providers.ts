/**
 * Audit and clean provider registry after spreadsheet imports.
 *
 * - Ensures every birth/postpartum engagement has a primary provider (inferred from packages/payouts).
 * - Backfills package providerId from the engagement primary provider when missing.
 * - Deletes providers with no lifetime revenue and no engagement references.
 *
 * Usage:
 *   APP_ENV=dev CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=... \
 *     npm run cleanup:providers -- --dry-run
 *
 *   npm run cleanup:providers
 */
import { clientsCrmStorageConfig } from "../src/lib/clients/config";
import {
  auditProviderCleanup,
  formatProviderCleanupReport,
  runProviderCleanup,
} from "../src/lib/providers/cleanup";

const parseArgs = () => ({
  dryRun: process.argv.includes("--dry-run"),
  auditOnly: process.argv.includes("--audit-only"),
});

const main = async () => {
  const { dryRun, auditOnly } = parseArgs();
  const { deploymentEnvironment, s3Prefix, useLocalStorage, localDataRoot } =
    clientsCrmStorageConfig;
  const target = useLocalStorage ? localDataRoot : `s3://${s3Prefix}`;

  console.log(
    `Provider cleanup — scope: ${deploymentEnvironment} (${target})${
      dryRun || auditOnly ? " [dry run]" : ""
    }`
  );

  if (dryRun) {
    const report = await runProviderCleanup({ dryRun: true });
    console.log(formatProviderCleanupReport(report, true));
    return;
  }

  const report = await runProviderCleanup({ dryRun: false });
  console.log(formatProviderCleanupReport(report, false));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
