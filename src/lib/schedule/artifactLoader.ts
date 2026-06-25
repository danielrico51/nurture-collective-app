import { getClientsStorageMode } from "@/lib/clients/config";
import { buildClientListPrefix, parseClientIdFromKey } from "@/lib/clients/paths";
import { listLocalKeys, readLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
} from "@/lib/clients/platformS3";
import { parseEngagementIdFromKey } from "@/lib/schedule/paths";
import type {
  EngagementPackage,
  ProviderPayoutBatch,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const READ_CONCURRENCY = 32;

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

export interface LoadedScheduleArtifacts {
  engagements: ServiceEngagement[];
  packagesByEngagement: Map<string, EngagementPackage[]>;
  payoutsByEngagement: Map<string, ProviderPayoutBatch[]>;
}

/** One S3 list + parallel reads for all engagement schedule artifacts. */
export const loadAllScheduleArtifacts = async (): Promise<LoadedScheduleArtifacts> => {
  const prefix = buildClientListPrefix();
  const allKeys = await listKeys(prefix);

  const engagementKeys = allKeys.filter((key) => key.endsWith("/engagement.json"));
  const packageKeys = allKeys.filter((key) => key.endsWith("/package.json"));
  const payoutKeys = allKeys.filter((key) => key.endsWith("/payout.json"));

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

  return { engagements, packagesByEngagement, payoutsByEngagement };
};

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
