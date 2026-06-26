/**
 * Align dev provider registry with production active roster (read-only prod fetch).
 *
 * Usage:
 *   PROD_NURTURE_CLIENTS_BUCKET=nurture-clients-prod-{accountId} \
 *   APP_ENV=dev CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=nurture-clients-dev-{accountId} \
 *     npm run unify:providers -- --dry-run
 *
 *   npm run unify:providers -- --report
 *   npm run unify:providers
 */
import { writeFile } from "fs/promises";
import path from "path";
import { clientsCrmStorageConfig } from "../src/lib/clients/config";
import {
  assertDevWriteTarget,
  auditDevProviderUnification,
  formatProviderUnifyReport,
  loadProviderUnifyOverrides,
  providerUnifyReportToJson,
  runDevProviderUnification,
} from "../src/lib/providers/unifyWithProd";

const parseArgs = () => ({
  dryRun: process.argv.includes("--dry-run"),
  reportOnly: process.argv.includes("--report"),
});

const main = async () => {
  const { dryRun, reportOnly } = parseArgs();
  const { deploymentEnvironment, s3Prefix, useLocalStorage, localDataRoot } =
    clientsCrmStorageConfig;
  const devTarget = useLocalStorage ? localDataRoot : `s3://${s3Prefix}`;

  console.log(
    `Provider unify — dev write target: ${deploymentEnvironment} (${devTarget})${
      dryRun || reportOnly ? " [dry run]" : ""
    }`
  );

  if (!dryRun && !reportOnly) {
    assertDevWriteTarget();
  }

  const overrides = await loadProviderUnifyOverrides();

  if (reportOnly) {
    const audit = await auditDevProviderUnification(overrides);
    const reportPath = path.join(
      process.cwd(),
      "scripts/data/provider-unify-report.json"
    );
    await writeFile(reportPath, providerUnifyReportToJson(audit), "utf8");
    console.log(formatProviderUnifyReport(audit, true));
    console.log(`\nWrote ${reportPath}`);
    return;
  }

  const report = await runDevProviderUnification({
    dryRun,
    overrides,
  });
  console.log(formatProviderUnifyReport(report, dryRun));

  if (report.blocked) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
