import { randomUUID } from "crypto";
import { getClientsStorageMode } from "@/lib/clients/config";
import {
  listLocalKeys,
  readLocalJson,
  writeLocalJson,
  deleteLocalJson,
  appendLocalClientProfile,
  writeLocalClientEmailIndex,
} from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
  deleteClientsJson,
  appendS3ClientProfile,
  writeS3ClientEmailIndex,
} from "@/lib/clients/platformS3";
import { buildClientListPrefix, sanitizeClientSegment } from "@/lib/clients/paths";
import { buildManualClientRecord } from "@/lib/clients/manualClient";
import { createClientService, updateClientService } from "@/lib/client-services/storage";
import { buildClientServiceKey } from "@/lib/client-services/paths";
import { listClients } from "@/lib/clients/storage";
import {
  findOrCreateProviderByLabel,
  listProviders,
  updateProvider,
} from "@/lib/providers/storage";
import {
  HISTORIC_BIRTH_SCHEDULE_CLIENT_SOURCE,
  HISTORIC_BIRTH_SCHEDULE_CLIENT_TAG,
} from "@/lib/schedule/birthDoulaImport/constants";
import {
  engagementHasFutureServiceDate,
  resolveHistoricClientStatus,
} from "@/lib/schedule/birthDoulaImport/clientStatus";
import { settlePastHistoricEngagements } from "@/lib/schedule/birthDoulaImport/settlePastEngagements";
import {
  HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_SOURCE,
  HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_TAG,
  POSTPARTUM_SCHEDULE_IMPORT_BATCH,
  POSTPARTUM_SCHEDULE_IMPORT_FILE,
  POSTPARTUM_SCHEDULE_SHEET,
} from "@/lib/schedule/postpartumDoulaImport/constants";
import { syncHistoricPostpartumClientStatuses } from "@/lib/schedule/postpartumDoulaImport/clientStatus";
import { matchPostpartumDoulaProvider } from "@/lib/schedule/postpartumDoulaImport/matchDoula";
import {
  moneyDollarsToCents,
  type ParsedPostpartumScheduleWorkbook,
  type PostpartumScheduleEngagementRow,
} from "@/lib/schedule/postpartumDoulaImport/parseWorkbook";
import {
  buildEngagementKey,
  buildExpectationKey,
  buildPackageKey,
  buildPackageListPrefix,
  buildPayoutKey,
  buildEngagementListPrefix,
} from "@/lib/schedule/paths";
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

const importKey = (rowNumber: number): string => `${POSTPARTUM_SCHEDULE_SHEET}:${rowNumber}`;

export interface PostpartumScheduleImportOptions {
  dryRun?: boolean;
  skipExisting?: boolean;
  repairMismatched?: boolean;
}

export interface PostpartumScheduleImportResult {
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

const isHistoricImportClient = (client: ClientRecord): boolean =>
  client.source === HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_SOURCE ||
  client.source === HISTORIC_BIRTH_SCHEDULE_CLIENT_SOURCE ||
  client.tags.includes(HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_TAG) ||
  client.tags.includes(HISTORIC_BIRTH_SCHEDULE_CLIENT_TAG);

const rowHasFutureServiceDate = (
  row: PostpartumScheduleEngagementRow,
  today = new Date().toISOString().slice(0, 10)
): boolean => row.startDate >= today;

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
      record?.importSource?.file === POSTPARTUM_SCHEDULE_IMPORT_FILE &&
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

      existing.set(importKey(record.importSource.rowStart), {
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

const expectedRowTotals = (row: PostpartumScheduleEngagementRow) => ({
  clientFeeCents: moneyDollarsToCents(row.clientFeeDollars),
  doulaFeeCents: moneyDollarsToCents(row.totalDoulaFeeDollars),
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

  const match = matchPostpartumDoulaProvider(label, providers);
  if (match.provider) {
    cache.set(cacheKey, match.provider);
    return { provider: match.provider, matchLabel: label };
  }

  const createLabel = match.canonicalName ?? label;
  const created = await findOrCreateProviderByLabel(createLabel, {
    roles: ["postpartum_doula"],
  });

  if (!created.roles.includes("postpartum_doula")) {
    await updateProvider(created.providerId, {
      roles: Array.from(new Set([...created.roles, "postpartum_doula"])),
      aliases: Array.from(new Set([...created.aliases, label.trim()])),
    });
  }

  cache.set(cacheKey, created);
  return { provider: created, matchLabel: label };
};

const writeExpectation = async (
  clientId: string,
  engagementId: string,
  packageId: string,
  input: Omit<
    ClientPaymentExpectation,
    | "expectationId"
    | "engagementId"
    | "packageId"
    | "createdAt"
    | "updatedAt"
    | "storageKey"
  >
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
  input: Omit<
    ProviderPayoutBatch,
    | "payoutBatchId"
    | "engagementId"
    | "createdAt"
    | "updatedAt"
    | "storageKey"
  >
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

const importEngagementRow = async (
  row: PostpartumScheduleEngagementRow,
  clientId: string,
  providers: ProviderRecord[],
  providerCache: Map<string, ProviderRecord>,
  dryRun: boolean
): Promise<{ unmatched: string[]; matches: Record<string, string> }> => {
  const unmatched: string[] = [];
  const matches: Record<string, string> = {};

  const match = matchPostpartumDoulaProvider(row.doulaLabel, providers);
  let provider = match.provider;
  if (!provider && !dryRun && row.doulaLabel.trim()) {
    const resolved = await resolveProvider(row.doulaLabel, providers, providerCache);
    provider = resolved.provider;
  }
  if (!provider && row.doulaLabel.trim()) {
    unmatched.push(row.doulaLabel);
  } else if (provider) {
    matches[row.doulaLabel] = provider.displayName;
  }

  if (dryRun) {
    return { unmatched, matches };
  }

  const clientFeeCents = moneyDollarsToCents(row.clientFeeDollars);
  if (clientFeeCents <= 0) {
    return { unmatched, matches };
  }

  const service = await createClientService(clientId, {
    title: `Postpartum doula ${row.scheduleYear}`,
    providerName: provider?.displayName ?? row.doulaLabel,
    providerId: provider?.providerId ?? null,
    serviceDate: row.startDate,
    totalFeeCents: clientFeeCents,
    status: "completed",
    notes: "Imported from historic postpartum doula schedule.",
  });

  const engagementId = randomUUID();
  const now = new Date().toISOString();
  const engagement: ServiceEngagement = {
    engagementId,
    clientId,
    serviceId: service.serviceId,
    serviceType: "postpartum",
    scheduleYear: row.scheduleYear,
    primaryProviderId: provider?.providerId ?? null,
    bookDate: row.startDate,
    estimatedDate: row.startDate,
    estimatedNotes: row.totalHours ? `${row.totalHours} hours` : "",
    status: "completed",
    preferredPaymentMethod: null,
    importSource: {
      file: POSTPARTUM_SCHEDULE_IMPORT_FILE,
      sheet: POSTPARTUM_SCHEDULE_SHEET,
      rowStart: row.rowNumber,
      importBatch: POSTPARTUM_SCHEDULE_IMPORT_BATCH,
    },
    createdAt: now,
    updatedAt: now,
  };

  const engagementKey = buildEngagementKey(clientId, engagementId);
  await writeJson(engagementKey, { ...engagement, storageKey: engagementKey });

  const packageId = randomUUID();
  const pkg: EngagementPackage = {
    packageId,
    engagementId,
    sortOrder: 0,
    label: "Primary",
    clientFeeCents,
    hoursTotal: row.totalHours > 0 ? row.totalHours : null,
    hoursAnnotation: "",
    schedulePattern: "",
    doulaFeeCents: row.totalDoulaFeeDollars
      ? moneyDollarsToCents(row.totalDoulaFeeDollars)
      : null,
    providerId: provider?.providerId ?? null,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
  const packageKey = buildPackageKey(clientId, engagementId, packageId);
  await writeJson(packageKey, { ...pkg, storageKey: packageKey });

  const depositCents = moneyDollarsToCents(row.totalDepositsDollars);
  if (depositCents > 0) {
    await writeExpectation(clientId, engagementId, packageId, {
      kind: "deposit",
      amountCents: Math.min(depositCents, clientFeeCents),
      dueDate: null,
      dueLabel: "",
      paidAt: null,
      invoiceId: null,
      coverageProviderId: null,
      notes: "",
    });
  }

  const balanceCents = Math.max(clientFeeCents - depositCents, 0);
  if (balanceCents > 0) {
    await writeExpectation(clientId, engagementId, packageId, {
      kind: "balance",
      amountCents: balanceCents,
      dueDate: row.startDate,
      dueLabel: "",
      paidAt: null,
      invoiceId: null,
      coverageProviderId: null,
      notes: "",
    });
  }

  const doulaPayoutCents = moneyDollarsToCents(row.totalDoulaFeeDollars);
  if (provider && doulaPayoutCents > 0) {
    await writePayout(clientId, engagementId, {
      packageId,
      providerId: provider.providerId,
      doulaFeeCents: doulaPayoutCents,
      amountCents: doulaPayoutCents,
      hours: row.totalHours > 0 ? row.totalHours : null,
      visitDatesLabel: "",
      shiftIds: [],
      paidAt: null,
      status: "pending",
      notes: "",
    });
  }

  await updateClientService(clientId, service.serviceId, {
    engagementId,
    totalFeeCents: clientFeeCents,
    serviceDate: row.startDate,
  });

  return { unmatched, matches };
};

export const importPostpartumScheduleWorkbook = async (
  workbook: ParsedPostpartumScheduleWorkbook,
  options: PostpartumScheduleImportOptions = {}
): Promise<PostpartumScheduleImportResult> => {
  const dryRun = options.dryRun ?? false;
  const skipExisting = options.skipExisting ?? true;
  const repairMismatched = options.repairMismatched ?? true;

  const providers = await listProviders({ includeArchived: false });
  const existingImports = skipExisting ? await loadExistingImports() : new Map();

  const clients = await listClients();
  const clientByName = new Map<string, ClientRecord>();
  for (const client of clients) {
    if (isHistoricImportClient(client)) {
      clientByName.set(normalizeClientName(client.name), client);
    }
  }

  const providerCache = new Map<string, ProviderRecord>();
  const result: PostpartumScheduleImportResult = {
    createdClients: 0,
    reusedClients: 0,
    createdEngagements: 0,
    skippedEngagements: 0,
    repairedEngagements: 0,
    unmatchedDoulas: [],
    providerMatches: {},
  };

  for (const row of workbook.engagements) {
    const key = importKey(row.rowNumber);
    const existing = existingImports.get(key);
    const expected = expectedRowTotals(row);

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

    let client = clientByName.get(normalizeClientName(row.clientName));
    if (!client && !dryRun) {
      const clientId = randomUUID();
      const record = buildManualClientRecord({
        clientId,
        payload: {
          name: row.clientName,
          email: "",
          phone: "",
          channel: "other",
          tags: [
            HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_TAG,
            `import:${POSTPARTUM_SCHEDULE_SHEET}`,
          ],
          notes: `Historic postpartum client imported from ${POSTPARTUM_SCHEDULE_IMPORT_FILE} (${POSTPARTUM_SCHEDULE_SHEET}, row ${row.rowNumber}).`,
        },
        coordinator: IMPORT_COORDINATOR,
      });
      client = {
        ...record,
        source: HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_SOURCE,
        status: resolveHistoricClientStatus(rowHasFutureServiceDate(row)),
      };
      client = await saveImportedClient(client);
      clientByName.set(normalizeClientName(row.clientName), client);
      result.createdClients += 1;
    } else if (client) {
      result.reusedClients += 1;
    } else {
      result.createdClients += 1;
    }

    if (!client && dryRun) {
      result.createdEngagements += 1;
      const match = matchPostpartumDoulaProvider(row.doulaLabel, providers);
      if (match.provider) {
        result.providerMatches[row.doulaLabel] = match.provider.displayName;
      } else if (row.doulaLabel.trim()) {
        result.unmatchedDoulas.push(row.doulaLabel);
      }
      continue;
    }

    if (!client) continue;

    const { unmatched, matches } = await importEngagementRow(
      row,
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
    await syncHistoricPostpartumClientStatuses();
    await settlePastHistoricEngagements();
  }

  return result;
};

export interface StoredPostpartumScheduleTotals {
  year: number;
  engagementCount: number;
  clientFeeCents: number;
  doulaFeeCents: number;
}

export const loadStoredPostpartumScheduleTotals = async (): Promise<
  StoredPostpartumScheduleTotals[]
> => {
  const prefix = buildClientListPrefix();
  const keys = await listKeys(prefix);
  const engagementKeys = keys.filter((key) => key.endsWith("/engagement.json"));
  const byYear = new Map<number, StoredPostpartumScheduleTotals>();

  for (const key of engagementKeys) {
    const engagement = await readJson<ServiceEngagement>(key);
    if (engagement?.importSource?.file !== POSTPARTUM_SCHEDULE_IMPORT_FILE) continue;

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
