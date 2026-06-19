/**
 * Seed provider registry from exported postpartum schedule HTML files.
 *
 * Usage:
 *   APP_ENV=dev npm run seed:providers -- --dry-run
 *   npm run seed:providers -- --dir "/path/to/Postpartum Doula Schedule"
 */
import { readFile, readdir } from "fs/promises";
import path from "path";
import { collectUniqueProviderLabels } from "../src/lib/providers/matching";
import { clientsCrmStorageConfig } from "../src/lib/clients/config";
import {
  createProvider,
  findOrCreateProviderByLabel,
  getProviderByName,
  listProviders,
} from "../src/lib/providers/storage";

const DEFAULT_DIR = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "Postpartum Doula Schedule"
);

const parseArgs = () => {
  const args = process.argv.slice(2);
  let dryRun = false;
  let dir = DEFAULT_DIR;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") dryRun = true;
    if (arg === "--dir" && args[index + 1]) {
      dir = args[index + 1];
      index += 1;
    }
  }
  return { dryRun, dir };
};

const stripCell = (html: string): string =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchAllCells = (pattern: RegExp, source: string): RegExpExecArray[] => {
  const matches: RegExpExecArray[] = [];
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  let match = re.exec(source);
  while (match) {
    matches.push(match);
    match = re.exec(source);
  }
  return matches;
};

const parseTableRows = (html: string): string[][] => {
  const rows: string[][] = [];
  for (const rowMatch of matchAllCells(/<tr[^>]*>([\s\S]*?)<\/tr>/i, html)) {
    const cells: string[] = [];
    for (const cellMatch of matchAllCells(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/i, rowMatch[1])) {
      cells.push(stripCell(cellMatch[1]));
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
};

const looksLikeProviderName = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\d/.test(trimmed)) return false;
  if (/^\$/.test(trimmed)) return false;
  if (/\d{1,2}\/\d/.test(trimmed)) return false;
  if (/^(cc|tnp credit|refund|n\/c|asap|see spreadsheet|see contract|--)$/i.test(trimmed)) {
    return false;
  }
  if (/^(balance due|deposit|client fee|amount|dates)$/i.test(trimmed)) return false;
  if (/^after\b/i.test(trimmed)) return false;
  if (/\bborn\b/i.test(trimmed)) return false;
  if (/^beg\b/i.test(trimmed)) return false;
  if (/^c\s+\d/i.test(trimmed)) return false;
  if (/^b\.?\s/i.test(trimmed)) return false;
  if (/qb\/\d{4}/i.test(trimmed)) return false;
  if (/^[-–—]+$/.test(trimmed)) return false;
  return trimmed.length <= 40;
};


const looksLikePrimaryProvider = (value: string): boolean => {
  if (!looksLikeProviderName(value)) return false;
  const trimmed = value.trim();
  if (
    /^(june|may|total|cooking|start date|to start|mid june|scheduled c|see other|not doing|dec\.\s*hrs|start approx)/i.test(
      trimmed
    )
  ) {
    return false;
  }
  if (/\b(june|may|dec)\b/i.test(trimmed) && /\d/.test(trimmed)) return false;
  if (/\d/.test(trimmed) && !/^[A-Za-z]+\//.test(trimmed)) return false;
  return /^[A-Za-z(][A-Za-z\s./&()-]{0,35}$/.test(trimmed);
};

const looksLikeBackupProvider = (value: string): boolean => {
  if (!looksLikePrimaryProvider(value)) return false;
  const trimmed = value.trim();
  if (/\d/.test(trimmed)) return false;
  return /^[A-Za-z][A-Za-z\s./&-]{0,30}$/.test(trimmed);
};

const extractProviderLabelsFromHtml = (html: string): string[] => {
  const rows = parseTableRows(html);
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => cell.toLowerCase() === "pp doula")
  );
  if (headerIndex < 0) return [];

  const labels: string[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const ppDoula = row[3]?.trim();
    if (ppDoula && looksLikePrimaryProvider(ppDoula)) labels.push(ppDoula);
    const backup = row[11]?.trim();
    if (backup && looksLikeBackupProvider(backup)) labels.push(backup);
  }
  return labels;
};

const main = async () => {
  const { dryRun, dir } = parseArgs();
  const { deploymentEnvironment, s3Prefix, useLocalStorage, localDataRoot } =
    clientsCrmStorageConfig;
  const target = useLocalStorage ? localDataRoot : `s3://${s3Prefix}`;
  console.log(
    `Provider registry scope: ${deploymentEnvironment} (${target})`
  );

  if (!dryRun && deploymentEnvironment === "prod") {
    if (process.env.SEED_PROVIDERS_ALLOW_PROD !== "true") {
      console.error(
        "Refusing to seed production providers. Set SEED_PROVIDERS_ALLOW_PROD=true to override."
      );
      process.exit(1);
    }
    console.warn("SEED_PROVIDERS_ALLOW_PROD=true — writing to production scope.");
  }

  const entries = await readdir(dir);
  const htmlFiles = entries.filter((name) => name.toLowerCase().endsWith(".html"));

  const allLabels: string[] = [];
  for (const file of htmlFiles) {
    const html = await readFile(path.join(dir, file), "utf8");
    allLabels.push(...extractProviderLabelsFromHtml(html));
  }

  const unique = collectUniqueProviderLabels(allLabels);
  console.log(`Found ${unique.length} unique provider labels in ${htmlFiles.length} HTML file(s).`);

  if (dryRun) {
    for (const label of unique) console.log(`  - ${label}`);
    return;
  }

  let created = 0;
  let skipped = 0;
  for (const label of unique) {
    const existing = await getProviderByName(label);
    if (existing) {
      skipped += 1;
      continue;
    }
    await findOrCreateProviderByLabel(label);
    created += 1;
  }

  const total = (await listProviders({ includeArchived: true })).length;
  console.log(`Created ${created} provider(s), skipped ${skipped} existing. Total in registry: ${total}.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
