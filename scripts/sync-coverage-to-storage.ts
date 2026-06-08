/**
 * Publish default coverage regions to S3 (or local .data/coverage).
 *
 * Usage:
 *   npm run sync:coverage
 *   TASKS_S3_BUCKET=nurture-collective-tasks npm run sync:coverage
 *   npm run sync:coverage -- --local
 *   npm run sync:coverage -- --dry-run
 */
import { mkdir, writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DEFAULT_COVERAGE_CONFIG } from "../src/lib/coverage/defaults";
import type { CoverageConfig } from "../src/types/coverage";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const COVERAGE_CONFIG_KEY = "platform/coverage/coverage-config.json";
const DEFAULT_BUCKET = "nurture-collective-tasks";
const LOCAL_FILE = join(process.cwd(), ".data", "coverage", "coverage-config.json");

const args = new Set(process.argv.slice(2));
const useLocal = args.has("--local");
const dryRun = args.has("--dry-run");

const buildPayload = (): CoverageConfig => ({
  ...DEFAULT_COVERAGE_CONFIG,
  version: (DEFAULT_COVERAGE_CONFIG.version ?? 1) + 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "sync-coverage-to-storage",
});

const writeLocal = async (config: CoverageConfig) => {
  await mkdir(join(process.cwd(), ".data", "coverage"), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(config, null, 2), "utf8");
  console.log(`Wrote local coverage config: ${LOCAL_FILE}`);
};

const writeS3 = async (config: CoverageConfig) => {
  const region =
    process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";
  const Bucket =
    process.env.INTAKE_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_BUCKET;
  const client = new S3Client({ region });

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key: COVERAGE_CONFIG_KEY,
      Body: JSON.stringify(config, null, 2),
      ContentType: "application/json",
    })
  );

  console.log(`Uploaded coverage config to s3://${Bucket}/${COVERAGE_CONFIG_KEY}`);
};

const main = async () => {
  const config = buildPayload();
  const activeRegions = config.regions.filter(
    (region) => region.id !== "national-waitlist"
  );

  console.log(`Coverage regions (${activeRegions.length} active):`);
  for (const region of activeRegions) {
    console.log(
      `  - ${region.name} [${region.status}] — ZIP prefixes: ${region.zipPrefixes.join(", ") || "(none)"}`
    );
  }

  if (dryRun) {
    console.log("\nDry run — no files written.");
    return;
  }

  const shouldUseLocal =
    useLocal ||
    (process.env.COVERAGE_USE_LOCAL_STORAGE === "true" && !process.env.TASKS_S3_BUCKET?.trim());

  if (shouldUseLocal) {
    await writeLocal(config);
  } else {
    await writeS3(config);
  }

  console.log("Done.");
};

main().catch((error) => {
  console.error("sync-coverage failed:", error);
  process.exit(1);
});
