/**
 * Import historic postpartum doula clients and engagements from the schedule workbook.
 *
 * Usage:
 *   APP_ENV=dev CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=... \
 *     npm run import:postpartum-schedule -- --dry-run
 *
 *   npm run import:postpartum-schedule -- --file "/path/to/Postpartum Doula Schedule.xlsx"
 *   npm run import:postpartum-schedule -- --verify-only
 */
import path from "path";
import { clientsCrmStorageConfig } from "../src/lib/clients/config";
import {
  importPostpartumScheduleWorkbook,
  loadStoredPostpartumScheduleTotals,
} from "../src/lib/schedule/postpartumDoulaImport/importRunner";
import { syncHistoricPostpartumClientStatuses } from "../src/lib/schedule/postpartumDoulaImport/clientStatus";
import { settlePastHistoricEngagements } from "../src/lib/schedule/birthDoulaImport/settlePastEngagements";
import { parsePostpartumScheduleWorkbook } from "../src/lib/schedule/postpartumDoulaImport/parseWorkbook";
import {
  buildExpectedTotalsRows,
  formatVerificationReport,
  summarizeWorkbookTotals,
  verifyStoredTotals,
} from "../src/lib/schedule/postpartumDoulaImport/verifyTotals";

const DEFAULT_FILE = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "Postpartum Doula Schedule.xlsx"
);

const parseArgs = () => {
  const args = process.argv.slice(2);
  let dryRun = false;
  let verifyOnly = false;
  let syncStatusOnly = false;
  let settlePastOnly = false;
  let file = DEFAULT_FILE;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") dryRun = true;
    if (arg === "--verify-only") verifyOnly = true;
    if (arg === "--sync-status") syncStatusOnly = true;
    if (arg === "--settle-past") settlePastOnly = true;
    if (arg === "--force") force = true;
    if (arg === "--file" && args[index + 1]) {
      file = args[index + 1]!;
      index += 1;
    }
  }

  return { dryRun, verifyOnly, syncStatusOnly, settlePastOnly, file, force };
};

const main = async () => {
  const { dryRun, verifyOnly, syncStatusOnly, settlePastOnly, file, force } =
    parseArgs();
  const { deploymentEnvironment, s3Prefix, useLocalStorage, localDataRoot } =
    clientsCrmStorageConfig;
  const target = useLocalStorage ? localDataRoot : `s3://${s3Prefix}`;

  console.log(
    `Postpartum doula schedule import — scope: ${deploymentEnvironment} (${target})`
  );
  console.log(`Workbook: ${file}`);

  if (!dryRun && !verifyOnly && deploymentEnvironment === "prod") {
    if (process.env.IMPORT_POSTPARTUM_SCHEDULE_ALLOW_PROD !== "true") {
      console.error(
        "Refusing to import into production. Set IMPORT_POSTPARTUM_SCHEDULE_ALLOW_PROD=true to override."
      );
      process.exit(1);
    }
  }

  if (settlePastOnly) {
    const settleResult = await settlePastHistoricEngagements({ dryRun });
    console.log(
      `Past engagement settlement — scanned ${settleResult.scanned}, settled ${settleResult.settled}, skipped future ${settleResult.skippedFuture}.`
    );
    console.log(
      `  expectations marked paid: ${settleResult.expectationsMarkedPaid}, payouts marked paid: ${settleResult.payoutsMarkedPaid}, settlement invoices: ${settleResult.settlementInvoicesCreated}.`
    );
    return;
  }

  if (syncStatusOnly) {
    const statusResult = await syncHistoricPostpartumClientStatuses({ dryRun });
    console.log(
      `Client status sync — scanned ${statusResult.scanned}, activated ${statusResult.activated}, deactivated ${statusResult.deactivated}, unchanged ${statusResult.unchanged}.`
    );
    return;
  }

  const workbook = parsePostpartumScheduleWorkbook(file);
  console.log(
    `Parsed ${workbook.engagements.length} engagement(s) from ${workbook.sheetName}.`
  );
  for (const line of summarizeWorkbookTotals(workbook.yearTotals)) {
    console.log(line);
  }

  const expectedRows = buildExpectedTotalsRows(workbook.yearTotals);

  if (verifyOnly) {
    const stored = await loadStoredPostpartumScheduleTotals();
    const report = verifyStoredTotals(expectedRows, stored);
    for (const line of formatVerificationReport(report)) {
      console.log(line);
    }
    if (report.some((row) => !row.ok)) {
      process.exit(1);
    }
    return;
  }

  const result = await importPostpartumScheduleWorkbook(workbook, {
    dryRun,
    skipExisting: !force,
  });

  console.log(
    `Clients created ${result.createdClients}, reused ${result.reusedClients}.`
  );
  console.log(
    `Engagements created ${result.createdEngagements}, skipped ${result.skippedEngagements}, repaired ${result.repairedEngagements}.`
  );

  if (result.unmatchedDoulas.length > 0) {
    console.log("Unmatched / newly created doula labels:");
    for (const label of result.unmatchedDoulas) {
      console.log(`  - ${label}`);
    }
  }

  if (Object.keys(result.providerMatches).length > 0) {
    console.log("Provider matches:");
    for (const [label, name] of Object.entries(result.providerMatches).sort()) {
      console.log(`  ${label} -> ${name}`);
    }
  }

  if (!dryRun) {
    const stored = await loadStoredPostpartumScheduleTotals();
    const report = verifyStoredTotals(expectedRows, stored);
    console.log("\nPost-import totals verification:");
    for (const line of formatVerificationReport(report)) {
      console.log(line);
    }
    if (report.some((row) => !row.ok)) {
      process.exit(1);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
