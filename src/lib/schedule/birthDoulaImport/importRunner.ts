import { randomUUID } from "crypto";
import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalKeys, readLocalJson, writeLocalJson, deleteLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
  deleteClientsJson,
} from "@/lib/clients/platformS3";
import { buildClientListPrefix, sanitizeClientSegment } from "@/lib/clients/paths";
import {
  buildManualClientRecord,
} from "@/lib/clients/manualClient";
import {
  appendLocalClientProfile,
  writeLocalClientEmailIndex,
} from "@/lib/clients/localStorage";
import {
  appendS3ClientProfile,
  writeS3ClientEmailIndex,
} from "@/lib/clients/platformS3";
import { createClientService } from "@/lib/client-services/storage";
import { updateClientService } from "@/lib/client-services/storage";
import { listClients } from "@/lib/clients/storage";
import {
  findOrCreateProviderByLabel,
  listProviders,
  updateProvider,
} from "@/lib/providers/storage";
import {
  BIRTH_SCHEDULE_IMPORT_BATCH,
  BIRTH_SCHEDULE_IMPORT_FILE,
  HISTORIC_BIRTH_SCHEDULE_CLIENT_SOURCE,
  HISTORIC_BIRTH_SCHEDULE_CLIENT_TAG,
} from "@/lib/schedule/birthDoulaImport/constants";
import {
  blockHasFutureServiceDate,
  resolveHistoricClientStatus,
  syncHistoricBirthClientStatuses,
} from "@/lib/schedule/birthDoulaImport/clientStatus";
import { settlePastHistoricEngagements } from "@/lib/schedule/birthDoulaImport/settlePastEngagements";
import { matchDoulaProvider } from "@/lib/schedule/birthDoulaImport/matchDoula";
import {
  moneyDollarsToCents,
  type BirthScheduleEngagementBlock,
  type BirthSchedulePackageRow,
  type ParsedBirthScheduleWorkbook,
} from "@/lib/schedule/birthDoulaImport/parseWorkbook";
import { pickLatestDate } from "@/lib/schedule/birthDoulaImport/parseDates";
import {
  buildEngagementKey,
  buildExpectationKey,
  buildPackageKey,
  buildPackageListPrefix,
  buildPayoutKey,
  buildEngagementListPrefix,
} from "@/lib/schedule/paths";
import { buildClientServiceKey } from "@/lib/client-services/paths";
import type { ClientRecord } from "@/types/client";
import type { ProviderRecord } from "@/types/provider";
import type {
  ClientPaymentExpectation,
  EngagementPackage,
  ProviderPayoutBatch,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const IMPORT_COORDINATOR = {
  id: "historic-import",
  email: "historic-import@system",
};

const listKeys = async (prefix: string): Promise<string[]> =>
  getClientsStorageMode() === "local"
    ? listLocalKeys(prefix)
    : listClientsKeys(prefix);

const writeJson = async (key: string, payload: unknown): Promise<void> => {
  if (getClientsStorageMode() === "local") {
    await writeLocalJson(key, payload);
  } else {
    await writeClientsJson(key, payload);
  }
};

const deleteJson = async (key: string): Promise<void> => {
  if (getClientsStorageMode() === "local") {
    await deleteLocalJson(key);
  } else {
    await deleteClientsJson(key);
  }
};

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

const normalizeClientName = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const importKey = (sheetName: string, rowStart: number): string =>
  `${sheetName}:${rowStart}`;

export interface BirthScheduleImportOptions {
  dryRun?: boolean;
  skipExisting?: boolean;
  repairMismatched?: boolean;
}

export interface BirthScheduleImportResult {
  createdClients: number;
  reusedClients: number;
  createdEngagements: number;
  skippedEngagements: number;
  repairedEngagements: number;
  unmatchedDoulas: string[];
  providerMatches: Record<string, string>;
}

interface ExistingImportedEngagement {
  clientId: string;
  engagementId: string;
  serviceId: string;
  clientFeeCents: number;
  doulaFeeCents: number;
}

const loadExistingImports = async (): Promise<
  Map<string, ExistingImportedEngagement>
> => {
  const prefix = buildClientListPrefix();
  const keys = await listKeys(prefix);
  const engagementKeys = keys.filter((key) => key.endsWith("/engagement.json"));
  const existing = new Map<string, ExistingImportedEngagement>();

  for (const key of engagementKeys) {
    const record = await readJson<ServiceEngagement>(key);
    if (
      record?.importSource?.file === BIRTH_SCHEDULE_IMPORT_FILE &&
      record.importSource.sheet
    ) {
      const packageKeys = (
        await listKeys(
          buildPackageListPrefix(record.clientId, record.engagementId)
        )
      ).filter((item) => item.endsWith("/package.json"));

      let clientFeeCents = 0;
      let doulaFeeCents = 0;
      for (const packageKey of packageKeys) {
        const pkg = await readJson<EngagementPackage>(packageKey);
        if (!pkg) continue;
        clientFeeCents += pkg.clientFeeCents;
        doulaFeeCents += pkg.doulaFeeCents ?? 0;
      }

      existing.set(importKey(record.importSource.sheet, record.importSource.rowStart), {
        clientId: record.clientId,
        engagementId: record.engagementId,
        serviceId: record.serviceId,
        clientFeeCents,
        doulaFeeCents,
      });
    }
  }

  return existing;
};

const expectedBlockTotals = (block: BirthScheduleEngagementBlock) => ({
  clientFeeCents: block.packages.reduce(
    (sum, pkg) => sum + moneyDollarsToCents(pkg.clientFeeDollars),
    0
  ),
  doulaFeeCents: block.packages.reduce(
    (sum, pkg) => sum + moneyDollarsToCents(pkg.doulaFeeDollars),
    0
  ),
});

const removeImportedEngagement = async (
  existing: ExistingImportedEngagement
): Promise<void> => {
  const engagementPrefix = `${buildEngagementListPrefix(existing.clientId)}engagement_id=${sanitizeClientSegment(existing.engagementId)}/`;
  const keys = await listKeys(engagementPrefix);
  for (const key of keys) {
    await deleteJson(key);
  }

  const serviceKey = buildClientServiceKey(existing.clientId, existing.serviceId);
  await deleteJson(serviceKey);
};

const saveImportedClient = async (client: ClientRecord): Promise<ClientRecord> => {
  const key =
    getClientsStorageMode() === "local"
      ? await appendLocalClientProfile(client)
      : await appendS3ClientProfile(client);

  if (client.email) {
    if (getClientsStorageMode() === "local") {
      await writeLocalClientEmailIndex(client.email, client.clientId);
    } else {
      await writeS3ClientEmailIndex(client.email, client.clientId);
    }
  }

  return { ...client, storageKey: key };
};

const resolveProvider = async (
  label: string,
  providers: ProviderRecord[],
  cache: Map<string, ProviderRecord>
): Promise<{ provider: ProviderRecord | null; matchLabel: string }> => {
  const cacheKey = label.trim().toLowerCase();
  if (cache.has(cacheKey)) {
    return { provider: cache.get(cacheKey)!, matchLabel: label };
  }

  const match = matchDoulaProvider(label, providers);
  if (match.provider) {
    cache.set(cacheKey, match.provider);
    return { provider: match.provider, matchLabel: label };
  }

  const createLabel = match.canonicalName ?? label;
  const created = await findOrCreateProviderByLabel(createLabel, {
    roles: ["birth_doula"],
  });

  if (!created.roles.includes("birth_doula")) {
    await updateProvider(created.providerId, {
      roles: Array.from(new Set([...created.roles, "birth_doula"])),
      aliases: Array.from(new Set([...created.aliases, label.trim()])),
    });
  }

  cache.set(cacheKey, created);
  return { provider: created, matchLabel: label };
};

const paidAtFromDate = (date: string | null): string | null =>
  date ? `${date}T12:00:00.000Z` : null;

const writeExpectation = async (
  clientId: string,
  engagementId: string,
  packageId: string,
  input: Omit<ClientPaymentExpectation, "expectationId" | "engagementId" | "packageId" | "createdAt" | "updatedAt" | "storageKey">
): Promise<void> => {
  const now = new Date().toISOString();
  const expectation: ClientPaymentExpectation = {
    expectationId: randomUUID(),
    engagementId,
    packageId,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const key = buildExpectationKey(
    clientId,
    engagementId,
    expectation.expectationId
  );
  await writeJson(key, { ...expectation, storageKey: key });
};

const writePayout = async (
  clientId: string,
  engagementId: string,
  input: Omit<ProviderPayoutBatch, "payoutBatchId" | "engagementId" | "createdAt" | "updatedAt" | "storageKey">
): Promise<void> => {
  const now = new Date().toISOString();
  const payout: ProviderPayoutBatch = {
    payoutBatchId: randomUUID(),
    engagementId,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const key = buildPayoutKey(clientId, engagementId, payout.payoutBatchId);
  await writeJson(key, { ...payout, storageKey: key });
};

const importEngagementBlock = async (
  block: BirthScheduleEngagementBlock,
  clientId: string,
  providers: ProviderRecord[],
  providerCache: Map<string, ProviderRecord>,
  dryRun: boolean
): Promise<{ unmatched: string[]; matches: Record<string, string> }> => {
  const unmatched: string[] = [];
  const matches: Record<string, string> = {};

  const primaryPkg = block.packages[0];
  if (!primaryPkg) return { unmatched, matches };

  const primaryMatch = matchDoulaProvider(primaryPkg.doulaLabel, providers);
  let primaryProvider = primaryMatch.provider;
  if (!primaryProvider && !dryRun) {
    const resolved = await resolveProvider(primaryPkg.doulaLabel, providers, providerCache);
    primaryProvider = resolved.provider;
  }
  if (!primaryProvider) {
    unmatched.push(primaryPkg.doulaLabel);
  } else {
    matches[primaryPkg.doulaLabel] = primaryProvider.displayName;
  }

  if (dryRun) {
    for (const pkg of block.packages.slice(1)) {
      const match = matchDoulaProvider(pkg.doulaLabel, providers);
      if (match.provider) {
        matches[pkg.doulaLabel] = match.provider.displayName;
      } else if (pkg.doulaLabel) {
        unmatched.push(pkg.doulaLabel);
      }
    }
    return { unmatched, matches };
  }

  const totalClientFeeCents = block.packages.reduce(
    (sum, pkg) => sum + moneyDollarsToCents(pkg.clientFeeDollars),
    0
  );

  if (totalClientFeeCents <= 0) {
    return { unmatched, matches };
  }

  const service = await createClientService(clientId, {
    title: `Birth doula ${block.scheduleYear}`,
    providerName: primaryProvider?.displayName ?? primaryPkg.doulaLabel,
    providerId: primaryProvider?.providerId ?? null,
    serviceDate: block.bookDate,
    totalFeeCents: totalClientFeeCents,
    status: "completed",
    notes: [
      block.packages[0]?.hospital ? `Hospital: ${block.packages[0].hospital}` : null,
      "Imported from historic birth doula schedule.",
    ]
      .filter(Boolean)
      .join(" "),
  });

  const engagementId = randomUUID();
  const now = new Date().toISOString();
  const engagement: ServiceEngagement = {
    engagementId,
    clientId,
    serviceId: service.serviceId,
    serviceType: "birth",
    scheduleYear: block.scheduleYear,
    primaryProviderId: primaryProvider?.providerId ?? null,
    bookDate: block.bookDate,
    estimatedDate: primaryPkg.dueDate,
    estimatedNotes: primaryPkg.hospital ? `Hospital: ${primaryPkg.hospital}` : "",
    status: "completed",
    preferredPaymentMethod: null,
    importSource: {
      file: BIRTH_SCHEDULE_IMPORT_FILE,
      sheet: block.sheetName,
      rowStart: block.rowStart,
      importBatch: BIRTH_SCHEDULE_IMPORT_BATCH,
    },
    createdAt: now,
    updatedAt: now,
  };

  const engagementKey = buildEngagementKey(clientId, engagementId);
  await writeJson(engagementKey, { ...engagement, storageKey: engagementKey });

  let lastProvider: ProviderRecord | null = primaryProvider;

  for (let sortOrder = 0; sortOrder < block.packages.length; sortOrder += 1) {
    const pkgRow = block.packages[sortOrder]!;
    let provider: ProviderRecord | null = null;
    if (pkgRow.doulaLabel.trim()) {
      const providerMatch = await resolveProvider(
        pkgRow.doulaLabel,
        providers,
        providerCache
      );
      provider = providerMatch.provider;
      if (!provider) unmatched.push(pkgRow.doulaLabel);
      if (provider) {
        matches[pkgRow.doulaLabel] = provider.displayName;
        lastProvider = provider;
      }
    } else {
      provider = lastProvider;
    }

    const packageId = randomUUID();
    const pkg: EngagementPackage = {
      packageId,
      engagementId,
      sortOrder,
      label: sortOrder === 0 ? "Primary" : pkgRow.doulaLabel || `Add-on ${sortOrder}`,
      clientFeeCents: moneyDollarsToCents(pkgRow.clientFeeDollars),
      hoursTotal: null,
      hoursAnnotation: "",
      schedulePattern: "",
      doulaFeeCents: pkgRow.doulaFeeDollars
        ? moneyDollarsToCents(pkgRow.doulaFeeDollars)
        : null,
      providerId: provider?.providerId ?? null,
      notes: pkgRow.notes,
      createdAt: now,
      updatedAt: now,
    };
    const packageKey = buildPackageKey(clientId, engagementId, packageId);
    await writeJson(packageKey, { ...pkg, storageKey: packageKey });

    if (pkgRow.clientDepositDollars > 0) {
      await writeExpectation(clientId, engagementId, packageId, {
        kind: "deposit",
        amountCents: moneyDollarsToCents(pkgRow.clientDepositDollars),
        dueDate: null,
        dueLabel: "",
        paidAt: paidAtFromDate(pkgRow.clientDepositPaid),
        invoiceId: null,
        coverageProviderId: null,
        notes: "",
      });
    }

    const balanceCents =
      pkgRow.clientBalanceDollars > 0
        ? moneyDollarsToCents(pkgRow.clientBalanceDollars)
        : Math.max(
            moneyDollarsToCents(pkgRow.clientFeeDollars) -
              moneyDollarsToCents(pkgRow.clientDepositDollars),
            0
          );

    if (balanceCents > 0) {
      await writeExpectation(clientId, engagementId, packageId, {
        kind: "balance",
        amountCents: balanceCents,
        dueDate:
          typeof pkgRow.clientBalanceDue === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(pkgRow.clientBalanceDue)
            ? pkgRow.clientBalanceDue
            : null,
        dueLabel:
          pkgRow.clientBalanceDue &&
          !/^\d{4}-\d{2}-\d{2}$/.test(String(pkgRow.clientBalanceDue))
            ? String(pkgRow.clientBalanceDue)
            : "",
        paidAt: paidAtFromDate(
          pkgRow.clientBalancePaid ??
            pickLatestDate(
              pkgRow.clientDepositPaid,
              pkgRow.doulaBalancePaid,
              pkgRow.doulaDepositPaid
            )
        ),
        invoiceId: null,
        coverageProviderId: null,
        notes: "",
      });
    }

    const doulaPaidAt = paidAtFromDate(
      pickLatestDate(pkgRow.doulaBalancePaid, pkgRow.doulaDepositPaid)
    );
    const doulaPayoutCents =
      pkgRow.doulaFeeDollars > 0
        ? moneyDollarsToCents(pkgRow.doulaFeeDollars)
        : 0;

    if (provider && doulaPayoutCents > 0) {
      await writePayout(clientId, engagementId, {
        packageId,
        providerId: provider.providerId,
        doulaFeeCents: doulaPayoutCents,
        amountCents: doulaPayoutCents,
        hours: null,
        visitDatesLabel: "",
        shiftIds: [],
        paidAt: doulaPaidAt,
        status: doulaPaidAt ? "paid" : "pending",
        notes: pkgRow.notes,
      });
    }
  }

  await updateClientService(clientId, service.serviceId, {
    engagementId,
    totalFeeCents: totalClientFeeCents,
    serviceDate: block.bookDate,
  });

  return { unmatched, matches };
};

export const importBirthScheduleWorkbook = async (
  workbook: ParsedBirthScheduleWorkbook,
  options: BirthScheduleImportOptions = {}
): Promise<BirthScheduleImportResult> => {
  const dryRun = options.dryRun ?? false;
  const skipExisting = options.skipExisting ?? true;
  const repairMismatched = options.repairMismatched ?? true;

  const providers = await listProviders({ includeArchived: false });
  const existingImports = skipExisting ? await loadExistingImports() : new Map();

  const clients = await listClients();
  const clientByName = new Map<string, ClientRecord>();
  for (const client of clients) {
    if (
      client.source === HISTORIC_BIRTH_SCHEDULE_CLIENT_SOURCE ||
      client.tags.includes(HISTORIC_BIRTH_SCHEDULE_CLIENT_TAG)
    ) {
      clientByName.set(normalizeClientName(client.name), client);
    }
  }

  const providerCache = new Map<string, ProviderRecord>();
  const result: BirthScheduleImportResult = {
    createdClients: 0,
    reusedClients: 0,
    createdEngagements: 0,
    skippedEngagements: 0,
    repairedEngagements: 0,
    unmatchedDoulas: [],
    providerMatches: {},
  };

  for (const block of workbook.engagements) {
    const key = importKey(block.sheetName, block.rowStart);
    const existing = existingImports.get(key);
    const expected = expectedBlockTotals(block);

    if (existing) {
      const totalsMatch =
        existing.clientFeeCents === expected.clientFeeCents &&
        existing.doulaFeeCents === expected.doulaFeeCents;

      if (totalsMatch) {
        result.skippedEngagements += 1;
        continue;
      }

      if (!repairMismatched) {
        result.skippedEngagements += 1;
        continue;
      }

      if (!dryRun) {
        await removeImportedEngagement(existing);
        result.repairedEngagements += 1;
      }
    }

    let client = clientByName.get(normalizeClientName(block.clientName));
    if (!client && !dryRun) {
      const clientId = randomUUID();
      const record = buildManualClientRecord({
        clientId,
        payload: {
          name: block.clientName,
          email: "",
          phone: "",
          channel: "other",
          tags: [
            HISTORIC_BIRTH_SCHEDULE_CLIENT_TAG,
            `import:${block.sheetName}`,
          ],
          notes: `Historic birth doula client imported from ${BIRTH_SCHEDULE_IMPORT_FILE} (${block.sheetName}, row ${block.rowStart}).`,
        },
        coordinator: IMPORT_COORDINATOR,
      });
      client = {
        ...record,
        source: HISTORIC_BIRTH_SCHEDULE_CLIENT_SOURCE,
        status: resolveHistoricClientStatus(blockHasFutureServiceDate(block)),
      };
      client = await saveImportedClient(client);
      clientByName.set(normalizeClientName(block.clientName), client);
      result.createdClients += 1;
    } else if (client) {
      result.reusedClients += 1;
    } else {
      result.createdClients += 1;
    }

    if (!client && dryRun) {
      result.createdEngagements += 1;
      const primary = block.packages[0];
      if (primary) {
        const match = matchDoulaProvider(primary.doulaLabel, providers);
        if (match.provider) {
          result.providerMatches[primary.doulaLabel] = match.provider.displayName;
        } else {
          result.unmatchedDoulas.push(primary.doulaLabel);
        }
      }
      continue;
    }

    if (!client) continue;

    const { unmatched, matches } = await importEngagementBlock(
      block,
      client.clientId,
      providers,
      providerCache,
      dryRun
    );
    result.unmatchedDoulas.push(...unmatched);
    Object.assign(result.providerMatches, matches);
    result.createdEngagements += 1;
  }

  result.unmatchedDoulas = Array.from(new Set(result.unmatchedDoulas)).sort();

  if (!dryRun) {
    await syncHistoricBirthClientStatuses();
    await settlePastHistoricEngagements();
  }

  return result;
};

export interface StoredBirthScheduleTotals {
  year: number;
  engagementCount: number;
  clientFeeCents: number;
  doulaFeeCents: number;
}

export const loadStoredBirthScheduleTotals = async (): Promise<
  StoredBirthScheduleTotals[]
> => {
  const prefix = buildClientListPrefix();
  const keys = await listKeys(prefix);
  const engagementKeys = keys.filter((key) => key.endsWith("/engagement.json"));
  const byYear = new Map<number, StoredBirthScheduleTotals>();

  for (const key of engagementKeys) {
    const engagement = await readJson<ServiceEngagement>(key);
    if (engagement?.importSource?.file !== BIRTH_SCHEDULE_IMPORT_FILE) continue;

    const clientId = engagement.clientId;

    const packageKeys = (
      await listKeys(
        buildPackageListPrefix(clientId, engagement.engagementId)
      )
    ).filter((item) => item.endsWith("/package.json"));

    let clientFeeCents = 0;
    let doulaFeeCents = 0;
    for (const packageKey of packageKeys) {
      const pkg = await readJson<EngagementPackage>(packageKey);
      if (!pkg) continue;
      clientFeeCents += pkg.clientFeeCents;
      doulaFeeCents += pkg.doulaFeeCents ?? 0;
    }

    const year = engagement.scheduleYear;
    const current = byYear.get(year) ?? {
      year,
      engagementCount: 0,
      clientFeeCents: 0,
      doulaFeeCents: 0,
    };
    current.engagementCount += 1;
    current.clientFeeCents += clientFeeCents;
    current.doulaFeeCents += doulaFeeCents;
    byYear.set(year, current);
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
};
