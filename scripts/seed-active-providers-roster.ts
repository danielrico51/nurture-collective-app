/**
 * Seed the active postpartum doula roster into the provider registry.
 *
 * Usage:
 *   APP_ENV=dev CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=... npm run seed:providers:roster -- --dry-run
 *   APP_ENV=dev CLIENTS_CRM_USE_S3=true NURTURE_CLIENTS_BUCKET=... npm run seed:providers:roster
 */
import { readFile } from "fs/promises";
import path from "path";
import { clientsCrmStorageConfig } from "../src/lib/clients/config";
import { normalizePhone } from "../src/lib/intake/submitService";
import {
  createProvider,
  getProviderByName,
  listProviders,
  updateProvider,
} from "../src/lib/providers/storage";

type RosterEntry = {
  displayName: string;
  cityState: string;
  phone: string;
};

const ROSTER_PATH = path.join(
  process.cwd(),
  "scripts/data/active-providers-roster.json"
);

const parseArgs = () => ({
  dryRun: process.argv.includes("--dry-run"),
});

const loadRoster = async (): Promise<RosterEntry[]> => {
  const raw = await readFile(ROSTER_PATH, "utf8");
  const parsed = JSON.parse(raw) as RosterEntry[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`Roster file is empty or invalid: ${ROSTER_PATH}`);
  }
  return parsed;
};

const main = async () => {
  const { dryRun } = parseArgs();
  const roster = await loadRoster();
  const { deploymentEnvironment, s3Prefix, useLocalStorage, localDataRoot } =
    clientsCrmStorageConfig;
  const target = useLocalStorage ? localDataRoot : `s3://${s3Prefix}`;

  console.log(
    `Provider roster seed — scope: ${deploymentEnvironment} (${target})`
  );
  console.log(`Entries in roster: ${roster.length}`);

  if (!dryRun && deploymentEnvironment === "prod") {
    if (process.env.SEED_PROVIDERS_ALLOW_PROD !== "true") {
      console.error(
        "Refusing to seed production providers. Set SEED_PROVIDERS_ALLOW_PROD=true to override."
      );
      process.exit(1);
    }
  }

  if (dryRun) {
    for (const entry of roster) {
      console.log(
        `  - ${entry.displayName} | ${entry.cityState} | ${normalizePhone(entry.phone)}`
      );
    }
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of roster) {
    const phone = normalizePhone(entry.phone);
    const notes = entry.cityState.trim();
    const existing = await getProviderByName(entry.displayName);

    if (!existing) {
      await createProvider({
        displayName: entry.displayName,
        aliases: [entry.displayName],
        roles: ["postpartum_doula"],
        phone,
        notes,
        status: "active",
      });
      created += 1;
      continue;
    }

    const needsPhone = phone && existing.phone !== phone;
    const needsNotes = notes && existing.notes !== notes;
    const needsRestore = Boolean(existing.archivedAt);

    if (!needsPhone && !needsNotes && !needsRestore) {
      skipped += 1;
      continue;
    }

    await updateProvider(existing.providerId, {
      ...(needsPhone ? { phone } : {}),
      ...(needsNotes ? { notes } : {}),
      ...(needsRestore ? { restore: true } : {}),
      status: "active",
    });
    updated += 1;
  }

  const total = (await listProviders({ includeArchived: true })).length;
  console.log(
    `Created ${created}, updated ${updated}, skipped ${skipped}. Total in registry: ${total}.`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
