import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalKeys, readLocalJson, appendLocalClientProfile } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  appendS3ClientProfile,
} from "@/lib/clients/platformS3";
import { buildEngagementListPrefix } from "@/lib/schedule/paths";
import { listClients } from "@/lib/clients/storage";
import {
  engagementHasFutureServiceDate,
  resolveHistoricClientStatus,
  todayIsoDate,
} from "@/lib/schedule/birthDoulaImport/clientStatus";
import {
  HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_SOURCE,
  HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_TAG,
} from "@/lib/schedule/postpartumDoulaImport/constants";
import type { ClientRecord } from "@/types/client";
import type { ServiceEngagement } from "@/types/serviceEngagement";

export {
  engagementHasFutureServiceDate,
  resolveHistoricClientStatus,
  todayIsoDate,
};

const listKeys = async (prefix: string): Promise<string[]> =>
  getClientsStorageMode() === "local"
    ? listLocalKeys(prefix)
    : listClientsKeys(prefix);

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

const saveClientProfile = async (client: ClientRecord): Promise<ClientRecord> => {
  const key =
    getClientsStorageMode() === "local"
      ? await appendLocalClientProfile(client)
      : await appendS3ClientProfile(client);
  return { ...client, storageKey: key };
};

const isHistoricPostpartumClient = (client: ClientRecord): boolean =>
  client.source === HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_SOURCE ||
  client.tags.includes(HISTORIC_POSTPARTUM_SCHEDULE_CLIENT_TAG);

const clientHasFutureServiceDate = async (
  clientId: string,
  today = todayIsoDate()
): Promise<boolean> => {
  const prefix = buildEngagementListPrefix(clientId);
  const keys = (await listKeys(prefix)).filter((key) =>
    key.endsWith("/engagement.json")
  );

  for (const key of keys) {
    const engagement = await readJson<ServiceEngagement>(key);
    if (engagement && engagementHasFutureServiceDate(engagement, today)) {
      return true;
    }
  }

  return false;
};

export interface SyncHistoricClientStatusResult {
  scanned: number;
  activated: number;
  deactivated: number;
  unchanged: number;
}

export const syncHistoricPostpartumClientStatuses = async (options?: {
  today?: string;
  dryRun?: boolean;
}): Promise<SyncHistoricClientStatusResult> => {
  const today = options?.today ?? todayIsoDate();
  const dryRun = options?.dryRun ?? false;
  const clients = (await listClients()).filter(isHistoricPostpartumClient);

  const result: SyncHistoricClientStatusResult = {
    scanned: clients.length,
    activated: 0,
    deactivated: 0,
    unchanged: 0,
  };

  for (const client of clients) {
    const hasFuture = await clientHasFutureServiceDate(client.clientId, today);
    const nextStatus = resolveHistoricClientStatus(hasFuture);

    if (client.status === nextStatus) {
      result.unchanged += 1;
      continue;
    }

    if (dryRun) {
      if (nextStatus === "active") result.activated += 1;
      else result.deactivated += 1;
      continue;
    }

    await saveClientProfile({
      ...client,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });

    if (nextStatus === "active") result.activated += 1;
    else result.deactivated += 1;
  }

  return result;
};
