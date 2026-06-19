import { randomUUID } from "crypto";
import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalKeys, readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { listClients } from "@/lib/clients/storage";
import { readProvider } from "@/lib/providers/storage";
import {
  buildEngagementListPrefix,
  buildPayoutKey,
  buildPayoutListPrefix,
  parseEngagementIdFromKey,
} from "@/lib/schedule/paths";
import {
  createScheduleShiftsFromLabel,
  linkShiftsToPayoutBatch,
} from "@/lib/schedule/shiftStorage";
import {
  ScheduleValidationError,
  validateCreateProviderPayoutBatchInput,
  validateUpdateProviderPayoutBatchInput,
} from "@/lib/schedule/validation";
import type {
  CreateProviderPayoutBatchInput,
  ProviderPayoutBatch,
  ProviderPayoutBatchWithProvider,
  ProviderPayoutReportRow,
  ServiceEngagement,
  UpdateProviderPayoutBatchInput,
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

const assertProviderExists = async (providerId: string): Promise<void> => {
  const provider = await readProvider(providerId);
  if (!provider) throw new ScheduleValidationError("Provider not found");
};

const withProviderName = async (
  payout: ProviderPayoutBatch
): Promise<ProviderPayoutBatchWithProvider> => {
  const provider = await readProvider(payout.providerId);
  return {
    ...payout,
    providerName: provider?.displayName ?? null,
  };
};

export const listPayoutsForEngagement = async (
  clientId: string,
  engagementId: string
): Promise<ProviderPayoutBatchWithProvider[]> => {
  const prefix = buildPayoutListPrefix(clientId, engagementId);
  const keys = (await listKeys(prefix)).filter((key) =>
    key.endsWith("/payout.json")
  );
  const payouts: ProviderPayoutBatchWithProvider[] = [];
  for (const key of keys) {
    const record = await readJson<ProviderPayoutBatch>(key);
    if (!record) continue;
    payouts.push(await withProviderName({ ...record, storageKey: key }));
  }
  return payouts.sort((a, b) => {
    const aDate = a.paidAt ?? a.createdAt;
    const bDate = b.paidAt ?? b.createdAt;
    return Date.parse(bDate) - Date.parse(aDate);
  });
};

export const createProviderPayoutBatch = async (
  clientId: string,
  engagement: ServiceEngagement,
  raw: unknown
): Promise<ProviderPayoutBatchWithProvider> => {
  const input = validateCreateProviderPayoutBatchInput(raw);
  await assertProviderExists(input.providerId);

  let shiftIds = input.shiftIds ?? [];
  if (input.visitDatesLabel && shiftIds.length === 0) {
    const shifts = await createScheduleShiftsFromLabel(clientId, engagement, {
      visitDatesLabel: input.visitDatesLabel,
      providerId: input.providerId,
      packageId: input.packageId,
    });
    shiftIds = shifts.map((shift) => shift.shiftId);
  }

  const now = new Date().toISOString();
  const payoutBatchId = randomUUID();
  const paidAt = input.paidAt ?? (input.status === "paid" ? now : null);
  const payout: ProviderPayoutBatch = {
    payoutBatchId,
    engagementId: engagement.engagementId,
    packageId: input.packageId ?? null,
    providerId: input.providerId,
    doulaFeeCents: input.doulaFeeCents ?? null,
    amountCents: input.amountCents,
    hours: input.hours ?? null,
    visitDatesLabel: input.visitDatesLabel ?? "",
    shiftIds,
    paidAt,
    status: paidAt ? "paid" : input.status ?? "pending",
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

  const key = buildPayoutKey(clientId, engagement.engagementId, payoutBatchId);
  await writeJson(key, payout);
  if (shiftIds.length > 0) {
    await linkShiftsToPayoutBatch(
      clientId,
      engagement.engagementId,
      shiftIds,
      payoutBatchId
    );
  }

  return withProviderName({ ...payout, storageKey: key });
};

export const updateProviderPayoutBatch = async (
  clientId: string,
  engagementId: string,
  payoutBatchId: string,
  raw: unknown
): Promise<ProviderPayoutBatchWithProvider> => {
  const updates = validateUpdateProviderPayoutBatchInput(raw);
  if (updates.providerId) {
    await assertProviderExists(updates.providerId);
  }

  const key = buildPayoutKey(clientId, engagementId, payoutBatchId);
  const existing = await readJson<ProviderPayoutBatch>(key);
  if (!existing) throw new ScheduleValidationError("Payout batch not found");

  const previousShiftIds = existing.shiftIds;
  let nextShiftIds =
    updates.shiftIds !== undefined ? updates.shiftIds : existing.shiftIds;

  if (updates.markPaid) {
    updates.status = "paid";
    updates.paidAt = updates.paidAt ?? new Date().toISOString();
  }

  const next: ProviderPayoutBatch = {
    ...existing,
    providerId: updates.providerId ?? existing.providerId,
    amountCents: updates.amountCents ?? existing.amountCents,
    packageId:
      updates.packageId !== undefined ? updates.packageId : existing.packageId,
    doulaFeeCents:
      updates.doulaFeeCents !== undefined
        ? updates.doulaFeeCents
        : existing.doulaFeeCents,
    hours: updates.hours !== undefined ? updates.hours : existing.hours,
    visitDatesLabel:
      updates.visitDatesLabel !== undefined
        ? updates.visitDatesLabel
        : existing.visitDatesLabel,
    shiftIds: nextShiftIds,
    paidAt: updates.paidAt !== undefined ? updates.paidAt : existing.paidAt,
    status: updates.status ?? existing.status,
    notes: updates.notes !== undefined ? updates.notes : existing.notes,
    updatedAt: new Date().toISOString(),
  };

  if (next.paidAt && next.status === "pending") {
    next.status = "paid";
  }

  await writeJson(key, next);

  const removed = previousShiftIds.filter((id) => !next.shiftIds.includes(id));
  const added = next.shiftIds.filter((id) => !previousShiftIds.includes(id));
  if (removed.length > 0) {
    await linkShiftsToPayoutBatch(clientId, engagementId, removed, null);
  }
  if (added.length > 0) {
    await linkShiftsToPayoutBatch(
      clientId,
      engagementId,
      added,
      payoutBatchId
    );
  }

  return withProviderName({ ...next, storageKey: key });
};

export const listProviderPayoutReport = async (options?: {
  providerId?: string;
  status?: "pending" | "paid" | "all";
  fromDate?: string;
  toDate?: string;
}): Promise<ProviderPayoutReportRow[]> => {
  const providerId = options?.providerId?.trim();
  const statusFilter = options?.status ?? "all";
  const fromMs = options?.fromDate
    ? Date.parse(`${options.fromDate}T00:00:00`)
    : null;
  const toMs = options?.toDate
    ? Date.parse(`${options.toDate}T23:59:59`)
    : null;

  const clients = await listClients();
  const rows: ProviderPayoutReportRow[] = [];

  for (const client of clients) {
    const prefix = buildEngagementListPrefix(client.clientId);
    const keys = (await listKeys(prefix)).filter((key) =>
      key.endsWith("/engagement.json")
    );

    for (const engagementKey of keys) {
      const engagementId = parseEngagementIdFromKey(engagementKey);
      if (!engagementId) continue;
      const engagement = await readJson<ServiceEngagement>(engagementKey);
      if (!engagement) continue;

      const payouts = await listPayoutsForEngagement(client.clientId, engagementId);
      for (const payout of payouts) {
        if (providerId && payout.providerId !== providerId) continue;
        if (statusFilter !== "all" && payout.status !== statusFilter) continue;

        const compareDate = payout.paidAt ?? payout.createdAt;
        const compareMs = Date.parse(compareDate);
        if (fromMs !== null && compareMs < fromMs) continue;
        if (toMs !== null && compareMs > toMs) continue;

        rows.push({
          ...payout,
          clientId: client.clientId,
          clientName: client.name,
          engagementId,
          scheduleYear: engagement.scheduleYear,
          bookDate: engagement.bookDate,
        });
      }
    }
  }

  return rows.sort(
    (a, b) =>
      Date.parse(b.paidAt ?? b.createdAt) - Date.parse(a.paidAt ?? a.createdAt)
  );
};

export const readProviderPayoutBatch = async (
  clientId: string,
  engagementId: string,
  payoutBatchId: string
): Promise<ProviderPayoutBatch | null> => {
  const key = buildPayoutKey(clientId, engagementId, payoutBatchId);
  const record = await readJson<ProviderPayoutBatch>(key);
  return record ? { ...record, storageKey: key } : null;
};
