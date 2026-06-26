import { getClientsStorageMode } from "@/lib/clients/config";
import {
  engagementRef,
  getPackagesForEngagement,
  getPayoutsForEngagement,
  loadAllScheduleArtifacts,
  type LoadedScheduleArtifacts,
} from "@/lib/clients/crmIndexLoader";
import { listLocalKeys, readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { listClientServicesWithInvoices, updateClientService } from "@/lib/client-services/storage";
import { listClients } from "@/lib/clients/storage";
import { readProvider } from "@/lib/providers/storage";
import { listPayoutsForEngagement, updateProviderPayoutBatch } from "@/lib/schedule/payoutStorage";
import {
  buildEngagementKey,
  buildEngagementListPrefix,
  buildPackageKey,
  buildPackageListPrefix,
  parseEngagementIdFromKey,
} from "@/lib/schedule/paths";
import { listShiftsForEngagement, updateScheduleShift } from "@/lib/schedule/shiftStorage";
import {
  patchProviderPayoutBatch,
  patchScheduleShift,
  ScheduleValidationError,
  updateEngagementPackage,
  updateServiceEngagement,
} from "@/lib/schedule/storage";
import type {
  EngagementPackage,
  ProviderEngagementAssignmentRole,
  ProviderEngagementRow,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const listKeys = async (prefix: string): Promise<string[]> =>
  getClientsStorageMode() === "local"
    ? listLocalKeys(prefix)
    : listClientsKeys(prefix);

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

const writeJson = async (key: string, payload: unknown): Promise<void> => {
  if (getClientsStorageMode() === "local") {
    await writeLocalJson(key, payload);
  } else {
    await writeClientsJson(key, payload);
  }
};

const listPackagesForEngagement = async (
  clientId: string,
  engagementId: string
): Promise<EngagementPackage[]> => {
  const prefix = buildPackageListPrefix(clientId, engagementId);
  const keys = (await listKeys(prefix)).filter((key) => key.endsWith("/package.json"));
  const packages: EngagementPackage[] = [];
  for (const key of keys) {
    const record = await readJson<EngagementPackage>(key);
    if (record) packages.push(record);
  }
  return packages.sort((a, b) => a.sortOrder - b.sortOrder);
};

const readEngagement = async (
  clientId: string,
  engagementId: string
): Promise<ServiceEngagement | null> =>
  readJson<ServiceEngagement>(buildEngagementKey(clientId, engagementId));

const collectAssignmentRoles = (
  providerId: string,
  engagement: ServiceEngagement,
  packages: EngagementPackage[],
  payoutProviderIds: string[],
  shiftProviderIds: string[]
): ProviderEngagementAssignmentRole[] => {
  const roles = new Set<ProviderEngagementAssignmentRole>();

  if (engagement.primaryProviderId === providerId) {
    roles.add("primary");
  }
  if (packages.some((pkg) => pkg.providerId === providerId)) {
    roles.add("package");
  }
  if (payoutProviderIds.includes(providerId)) {
    roles.add("payout");
  }
  if (shiftProviderIds.includes(providerId)) {
    roles.add("shift");
  }

  return Array.from(roles);
};

export const listProviderEngagements = async (
  providerId: string
): Promise<ProviderEngagementRow[]> => {
  const trimmedProviderId = providerId.trim();
  if (!trimmedProviderId) {
    throw new ScheduleValidationError("providerId is required");
  }

  const provider = await readProvider(trimmedProviderId);
  if (!provider) {
    throw new ScheduleValidationError("Provider not found");
  }

  const clients = await listClients();
  const rows: ProviderEngagementRow[] = [];

  for (const client of clients) {
    const prefix = buildEngagementListPrefix(client.clientId);
    const engagementKeys = (await listKeys(prefix)).filter((key) =>
      key.endsWith("/engagement.json")
    );

    for (const engagementKey of engagementKeys) {
      const engagementId = parseEngagementIdFromKey(engagementKey);
      if (!engagementId) continue;

      const engagement = await readEngagement(client.clientId, engagementId);
      if (!engagement) continue;

      const packages = await listPackagesForEngagement(client.clientId, engagementId);
      const payouts = await listPayoutsForEngagement(client.clientId, engagementId);
      const shifts = await listShiftsForEngagement(client.clientId, engagementId);

      const assignmentRoles = collectAssignmentRoles(
        trimmedProviderId,
        engagement,
        packages,
        payouts.map((payout) => payout.providerId),
        shifts.map((shift) => shift.providerId)
      );

      if (assignmentRoles.length === 0) continue;

      rows.push({
        clientId: client.clientId,
        clientName: client.name,
        engagementId,
        serviceType: engagement.serviceType,
        scheduleYear: engagement.scheduleYear,
        bookDate: engagement.bookDate,
        estimatedDate: engagement.estimatedDate,
        status: engagement.status,
        assignmentRoles,
        packageLabels: packages
          .filter((pkg) => pkg.providerId === trimmedProviderId)
          .map((pkg) => pkg.label),
        totalClientFeeCents: packages.reduce(
          (sum, pkg) => sum + pkg.clientFeeCents,
          0
        ),
        totalDoulaFeeCents: packages.reduce(
          (sum, pkg) => sum + (pkg.doulaFeeCents ?? 0),
          0
        ),
        importSource: engagement.importSource ?? null,
      });
    }
  }

  return rows.sort((a, b) => {
    const aDate = a.estimatedDate ?? a.bookDate;
    const bDate = b.estimatedDate ?? b.bookDate;
    return Date.parse(bDate) - Date.parse(aDate);
  });
};

export const reallocateProviderEngagement = async (input: {
  fromProviderId: string;
  toProviderId: string;
  clientId: string;
  engagementId: string;
}): Promise<{ updatedCount: number }> => {
  const fromProviderId = input.fromProviderId.trim();
  const toProviderId = input.toProviderId.trim();
  const clientId = input.clientId.trim();
  const engagementId = input.engagementId.trim();

  if (!fromProviderId || !toProviderId || !clientId || !engagementId) {
    throw new ScheduleValidationError("Missing required reallocation fields");
  }
  if (fromProviderId === toProviderId) {
    throw new ScheduleValidationError("Choose a different target provider");
  }

  const [fromProvider, toProvider] = await Promise.all([
    readProvider(fromProviderId),
    readProvider(toProviderId),
  ]);
  if (!fromProvider || !toProvider) {
    throw new ScheduleValidationError("Provider not found");
  }

  const engagement = await readEngagement(clientId, engagementId);
  if (!engagement) {
    throw new ScheduleValidationError("Engagement not found");
  }

  let updatedCount = 0;

  if (engagement.primaryProviderId === fromProviderId) {
    await updateServiceEngagement(clientId, engagementId, {
      primaryProviderId: toProviderId,
    });
    updatedCount += 1;
  }

  const packages = await listPackagesForEngagement(clientId, engagementId);
  for (const pkg of packages) {
    if (pkg.providerId !== fromProviderId) continue;
    await updateEngagementPackage(clientId, engagementId, pkg.packageId, {
      providerId: toProviderId,
    });
    updatedCount += 1;
  }

  const payouts = await listPayoutsForEngagement(clientId, engagementId);
  for (const payout of payouts) {
    if (payout.providerId !== fromProviderId) continue;
    await patchProviderPayoutBatch(clientId, engagementId, payout.payoutBatchId, {
      providerId: toProviderId,
    });
    updatedCount += 1;
  }

  const shifts = await listShiftsForEngagement(clientId, engagementId);
  for (const shift of shifts) {
    if (shift.providerId !== fromProviderId) continue;
    await patchScheduleShift(clientId, engagementId, shift.shiftId, {
      providerId: toProviderId,
    });
    updatedCount += 1;
  }

  if (updatedCount === 0) {
    throw new ScheduleValidationError(
      "This provider is not assigned to that engagement"
    );
  }

  return { updatedCount };
};

/** Fast provider remapping for bulk migrations — skips full engagement detail rebuilds. */
export const reallocateProviderEngagementLite = async (
  input: {
    fromProviderId: string;
    toProviderId: string;
    toProviderName: string;
    clientId: string;
    engagementId: string;
  },
  artifacts?: LoadedScheduleArtifacts
): Promise<number> => {
  const fromProviderId = input.fromProviderId.trim();
  const toProviderId = input.toProviderId.trim();
  const clientId = input.clientId.trim();
  const engagementId = input.engagementId.trim();
  if (!fromProviderId || !toProviderId || !clientId || !engagementId) return 0;
  if (fromProviderId === toProviderId) return 0;

  const engagement = await readEngagement(clientId, engagementId);
  if (!engagement) return 0;

  let updatedCount = 0;
  const now = new Date().toISOString();

  if (engagement.primaryProviderId === fromProviderId) {
    const key = buildEngagementKey(clientId, engagementId);
    await writeJson(key, {
      ...engagement,
      primaryProviderId: toProviderId,
      updatedAt: now,
      storageKey: key,
    });
    await updateClientService(clientId, engagement.serviceId, {
      providerId: toProviderId,
      providerName: input.toProviderName,
    });
    updatedCount += 1;
  }

  const packages = artifacts
    ? getPackagesForEngagement(artifacts, clientId, engagementId)
    : await listPackagesForEngagement(clientId, engagementId);
  for (const pkg of packages) {
    if (pkg.providerId !== fromProviderId) continue;
    const key = buildPackageKey(clientId, engagementId, pkg.packageId);
    await writeJson(key, {
      ...pkg,
      providerId: toProviderId,
      updatedAt: now,
      storageKey: key,
    });
    updatedCount += 1;
  }

  const payouts = artifacts
    ? getPayoutsForEngagement(artifacts, clientId, engagementId)
    : await listPayoutsForEngagement(clientId, engagementId);
  for (const payout of payouts) {
    if (payout.providerId !== fromProviderId) continue;
    await updateProviderPayoutBatch(clientId, engagementId, payout.payoutBatchId, {
      providerId: toProviderId,
    });
    updatedCount += 1;
  }

  const shifts = await listShiftsForEngagement(clientId, engagementId);
  for (const shift of shifts) {
    if (shift.providerId !== fromProviderId) continue;
    await updateScheduleShift(clientId, engagementId, shift.shiftId, {
      providerId: toProviderId,
    });
    updatedCount += 1;
  }

  return updatedCount;
};

const listProviderEngagementRefsFromArtifacts = (
  artifacts: LoadedScheduleArtifacts,
  providerId: string
): Array<{ clientId: string; engagementId: string }> => {
  const refs: Array<{ clientId: string; engagementId: string }> = [];

  for (const engagement of artifacts.engagements) {
    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];
    const payouts = artifacts.payoutsByEngagement.get(ref) ?? [];
    const isAssigned =
      engagement.primaryProviderId === providerId ||
      packages.some((pkg) => pkg.providerId === providerId) ||
      payouts.some((payout) => payout.providerId === providerId);

    if (!isAssigned) continue;
    refs.push({
      clientId: engagement.clientId,
      engagementId: engagement.engagementId,
    });
  }

  return refs;
};

export const reallocateAllProviderReferences = async (
  input: {
    fromProviderId: string;
    toProviderId: string;
    toProviderName: string;
  },
  options?: { artifacts?: LoadedScheduleArtifacts }
): Promise<{ engagementUpdates: number; serviceUpdates: number }> => {
  const fromProviderId = input.fromProviderId.trim();
  const toProviderId = input.toProviderId.trim();
  if (!fromProviderId || !toProviderId || fromProviderId === toProviderId) {
    return { engagementUpdates: 0, serviceUpdates: 0 };
  }

  const artifacts = options?.artifacts ?? (await loadAllScheduleArtifacts());
  const rows = listProviderEngagementRefsFromArtifacts(artifacts, fromProviderId);
  let engagementUpdates = 0;

  for (const row of rows) {
    engagementUpdates += await reallocateProviderEngagementLite(
      {
        fromProviderId,
        toProviderId,
        toProviderName: input.toProviderName,
        clientId: row.clientId,
        engagementId: row.engagementId,
      },
      artifacts
    );
  }

  const serviceUpdates = await reallocateClientServiceProviders({
    fromProviderId,
    toProviderId,
    toProviderName: input.toProviderName,
  });

  return { engagementUpdates, serviceUpdates };
};

export const reallocateClientServiceProviders = async (input: {
  fromProviderId: string;
  toProviderId: string;
  toProviderName: string;
}): Promise<number> => {
  const fromProviderId = input.fromProviderId.trim();
  const toProviderId = input.toProviderId.trim();
  if (!fromProviderId || !toProviderId || fromProviderId === toProviderId) {
    return 0;
  }

  const clients = await listClients();
  let updatedCount = 0;

  for (const client of clients) {
    const services = await listClientServicesWithInvoices(client.clientId);
    for (const service of services) {
      if (service.providerId !== fromProviderId) continue;
      await updateClientService(client.clientId, service.serviceId, {
        providerId: toProviderId,
        providerName: input.toProviderName,
      });
      updatedCount += 1;
    }
  }

  return updatedCount;
};
