import { getClientsStorageMode } from "@/lib/clients/config";
import {
  buildClientListPrefix,
  CLIENT_PROFILE_FILENAME,
  parseClientIdFromKey,
} from "@/lib/clients/paths";
import { listLocalKeys, readLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
} from "@/lib/clients/platformS3";
import { parseEngagementIdFromKey } from "@/lib/schedule/paths";
import type { ClientRecord, ClientStatus } from "@/types/client";
import type {
  EngagementPackage,
  ProviderPayoutBatch,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const READ_CONCURRENCY = 64;
const CACHE_TTL_MS = 5 * 60 * 1000;

const listKeys = async (prefix: string): Promise<string[]> =>
  getClientsStorageMode() === "local"
    ? listLocalKeys(prefix)
    : listClientsKeys(prefix);

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

export const engagementRef = (clientId: string, engagementId: string): string =>
  `${clientId}:${engagementId}`;

const parseEngagementRefFromKey = (key: string): string | null => {
  const clientId = parseClientIdFromKey(key);
  const engagementId = parseEngagementIdFromKey(key);
  if (!clientId || !engagementId) return null;
  return engagementRef(clientId, engagementId);
};

const mapPool = async <T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index], index);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
};

export interface ClientSummary {
  clientId: string;
  status: ClientStatus;
  archivedAt: string | null;
}

export interface LoadedScheduleArtifacts {
  engagements: ServiceEngagement[];
  packagesByEngagement: Map<string, EngagementPackage[]>;
  payoutsByEngagement: Map<string, ProviderPayoutBatch[]>;
}

export interface CrmStorageIndex {
  loadedAt: string;
  clientSummaries: ClientSummary[];
  clientNamesById: Map<string, string>;
  schedule: LoadedScheduleArtifacts;
}

let cachedIndex: { expiresAt: number; data: CrmStorageIndex } | null = null;

export const invalidateCrmStorageIndexCache = (): void => {
  cachedIndex = null;
};

export const loadCrmStorageIndex = async (options?: {
  force?: boolean;
}): Promise<CrmStorageIndex> => {
  if (!options?.force && cachedIndex && cachedIndex.expiresAt > Date.now()) {
    return cachedIndex.data;
  }

  const prefix = buildClientListPrefix();
  const allKeys = await listKeys(prefix);

  const latestProfileKeyByClient = new Map<string, string>();
  const engagementKeys: string[] = [];
  const packageKeys: string[] = [];
  const payoutKeys: string[] = [];

  for (const key of allKeys) {
    if (key.endsWith(`/${CLIENT_PROFILE_FILENAME}`) && key.includes("/profile/")) {
      const clientId = parseClientIdFromKey(key);
      if (!clientId) continue;
      const existing = latestProfileKeyByClient.get(clientId);
      if (!existing || key > existing) {
        latestProfileKeyByClient.set(clientId, key);
      }
      continue;
    }
    if (key.endsWith("/engagement.json")) {
      engagementKeys.push(key);
    } else if (key.endsWith("/package.json")) {
      packageKeys.push(key);
    } else if (key.endsWith("/payout.json")) {
      payoutKeys.push(key);
    }
  }

  const profileRecords = await mapPool(
    Array.from(latestProfileKeyByClient.values()),
    READ_CONCURRENCY,
    (key) => readJson<ClientRecord>(key)
  );
  const clientSummaries: ClientSummary[] = profileRecords
    .filter((record): record is ClientRecord => record !== null)
    .map((record) => ({
      clientId: record.clientId,
      status: record.status,
      archivedAt: record.archivedAt,
    }));

  const clientNamesById = new Map<string, string>();
  for (const record of profileRecords) {
    if (!record) continue;
    clientNamesById.set(record.clientId, record.name.trim() || record.clientId);
  }

  const engagements = (
    await mapPool(engagementKeys, READ_CONCURRENCY, (key) =>
      readJson<ServiceEngagement>(key)
    )
  ).filter((record): record is ServiceEngagement => record !== null);

  const packagesByEngagement = new Map<string, EngagementPackage[]>();
  const packageRecords = await mapPool(packageKeys, READ_CONCURRENCY, (key) =>
    readJson<EngagementPackage>(key).then((record) => ({ key, record }))
  );
  for (const { key, record } of packageRecords) {
    if (!record) continue;
    const ref = parseEngagementRefFromKey(key);
    if (!ref) continue;
    const existing = packagesByEngagement.get(ref) ?? [];
    existing.push(record);
    packagesByEngagement.set(ref, existing);
  }
  for (const packages of Array.from(packagesByEngagement.values())) {
    packages.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const payoutsByEngagement = new Map<string, ProviderPayoutBatch[]>();
  const payoutRecords = await mapPool(payoutKeys, READ_CONCURRENCY, (key) =>
    readJson<ProviderPayoutBatch>(key).then((record) => ({ key, record }))
  );
  for (const { key, record } of payoutRecords) {
    if (!record) continue;
    const ref = parseEngagementRefFromKey(key);
    if (!ref) continue;
    const existing = payoutsByEngagement.get(ref) ?? [];
    existing.push(record);
    payoutsByEngagement.set(ref, existing);
  }

  const data: CrmStorageIndex = {
    loadedAt: new Date().toISOString(),
    clientSummaries,
    clientNamesById,
    schedule: { engagements, packagesByEngagement, payoutsByEngagement },
  };

  cachedIndex = { expiresAt: Date.now() + CACHE_TTL_MS, data };
  return data;
};

export const loadAllScheduleArtifacts = async (): Promise<LoadedScheduleArtifacts> =>
  (await loadCrmStorageIndex()).schedule;

export const getPackagesForEngagement = (
  artifacts: LoadedScheduleArtifacts,
  clientId: string,
  engagementId: string
): EngagementPackage[] =>
  artifacts.packagesByEngagement.get(engagementRef(clientId, engagementId)) ?? [];

export const getPayoutsForEngagement = (
  artifacts: LoadedScheduleArtifacts,
  clientId: string,
  engagementId: string
): ProviderPayoutBatch[] =>
  artifacts.payoutsByEngagement.get(engagementRef(clientId, engagementId)) ?? [];
