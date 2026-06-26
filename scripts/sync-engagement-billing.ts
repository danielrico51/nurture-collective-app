/**
 * Backfill linked service title + deposit/balance invoices for one client.
 *
 * Usage:
 *   APP_ENV=prod CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=nurture-clients-prod-... \
 *     npx tsx scripts/sync-engagement-billing.ts <clientId> [--dry-run]
 */
import { listEngagementsForClient } from "../src/lib/schedule/storage";
import { ensureEngagementPaymentInvoicesSynced } from "../src/lib/schedule/engagementBillingSync";
import { clientsCrmStorageConfig, getClientsCrmBucket } from "../src/lib/clients/config";

const clientId = process.argv[2]?.trim();
const dryRun = process.argv.includes("--dry-run");

if (!clientId) {
  console.error(
    "Usage: npx tsx scripts/sync-engagement-billing.ts <clientId> [--dry-run]"
  );
  process.exit(1);
}

const main = async () => {
  const { deploymentEnvironment, useLocalStorage, s3Prefix, localDataRoot } =
    clientsCrmStorageConfig;
  const bucket = getClientsCrmBucket();
  const target = useLocalStorage ? localDataRoot : `s3://${bucket}/${s3Prefix}`;

  console.log(
    `${dryRun ? "[dry run] " : ""}Sync engagement billing for ${clientId} (${deploymentEnvironment}, ${target})`
  );

  const engagements = await listEngagementsForClient(clientId);
  if (engagements.length === 0) {
    console.log("No engagements found.");
    return;
  }

  for (const engagement of engagements) {
    console.log(
      `  engagement ${engagement.engagementId} → service ${engagement.serviceId ?? "none"} (${engagement.serviceType} ${engagement.scheduleYear})`
    );
    if (!dryRun) {
      await ensureEngagementPaymentInvoicesSynced(clientId, engagement);
    }
  }

  console.log(
    dryRun
      ? `\n${engagements.length} engagement(s). Re-run without --dry-run to apply.`
      : `\nSynced ${engagements.length} engagement(s).`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
