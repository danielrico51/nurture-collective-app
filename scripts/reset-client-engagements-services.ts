/**
 * Remove all schedule engagements and client services (including invoices) for one client.
 * Profile, notes, and communications are kept.
 *
 * Usage:
 *   APP_ENV=prod CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=nurture-clients-prod-... \
 *     npx tsx scripts/reset-client-engagements-services.ts <clientId> --dry-run
 *
 *   Add --apply to write. Prod requires --confirm-prod.
 */
import { clientsCrmStorageConfig, getClientsCrmBucket } from "../src/lib/clients/config";
import { buildClientRootPrefix } from "../src/lib/clients/paths";
import { deleteLocalJson, listLocalKeys } from "../src/lib/clients/localStorage";
import { deleteClientsJson, listClientsKeys } from "../src/lib/clients/platformS3";

const clientId = process.argv[2]?.trim();
const dryRun = !process.argv.includes("--apply");
const confirmProd = process.argv.includes("--confirm-prod");

if (!clientId) {
  console.error("Usage: npx tsx scripts/reset-client-engagements-services.ts <clientId> [--dry-run|--apply] [--confirm-prod]");
  process.exit(1);
}

const prefixes = ["engagements/", "services/"].map(
  (segment) => `${buildClientRootPrefix(clientId)}${segment}`
);

const main = async () => {
  const { deploymentEnvironment, useLocalStorage, s3Prefix, localDataRoot } =
    clientsCrmStorageConfig;
  const bucket = getClientsCrmBucket();
  const target = useLocalStorage ? localDataRoot : `s3://${bucket}/${s3Prefix}`;

  if (deploymentEnvironment === "prod" && !dryRun && !confirmProd) {
    throw new Error("Refusing prod write without --confirm-prod");
  }

  console.log(
    `${dryRun ? "[dry run] " : ""}Reset engagements + services for ${clientId} (${deploymentEnvironment}, ${target})`
  );

  const listKeys = useLocalStorage ? listLocalKeys : listClientsKeys;
  const deleteKey = useLocalStorage ? deleteLocalJson : deleteClientsJson;

  const keys: string[] = [];
  for (const prefix of prefixes) {
    const found = await listKeys(prefix);
    keys.push(...found.filter((key) => key.endsWith(".json") || key.endsWith(".html")));
  }

  keys.sort();
  if (keys.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  for (const key of keys) {
    console.log(`  ${dryRun ? "would delete" : "delete"} ${key}`);
  }

  if (dryRun) {
    console.log(`\n${keys.length} object(s). Re-run with --apply --confirm-prod to delete.`);
    return;
  }

  for (const key of keys) {
    await deleteKey(key);
  }

  console.log(`\nDeleted ${keys.length} object(s). Client profile and notes were not changed.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
