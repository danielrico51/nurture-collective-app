import { randomUUID } from "crypto";
import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalKeys, readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { readProvider } from "@/lib/providers/storage";
import { parseVisitDatesLabel } from "@/lib/schedule/dateParser";
import {
  buildShiftKey,
  buildShiftListPrefix,
} from "@/lib/schedule/paths";
import {
  ScheduleValidationError,
  validateCreateScheduleShiftInput,
  validateCreateScheduleShiftsFromLabelInput,
  validateUpdateScheduleShiftInput,
} from "@/lib/schedule/validation";
import type {
  CreateScheduleShiftInput,
  CreateScheduleShiftsFromLabelInput,
  ScheduleShift,
  ScheduleShiftWithProvider,
  ServiceEngagement,
  UpdateScheduleShiftInput,
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
  shift: ScheduleShift
): Promise<ScheduleShiftWithProvider> => {
  const provider = await readProvider(shift.providerId);
  return {
    ...shift,
    providerName: provider?.displayName ?? null,
  };
};

export const listShiftsForEngagement = async (
  clientId: string,
  engagementId: string
): Promise<ScheduleShiftWithProvider[]> => {
  const prefix = buildShiftListPrefix(clientId, engagementId);
  const keys = (await listKeys(prefix)).filter((key) =>
    key.endsWith("/shift.json")
  );
  const shifts: ScheduleShiftWithProvider[] = [];
  for (const key of keys) {
    const record = await readJson<ScheduleShift>(key);
    if (!record) continue;
    shifts.push(await withProviderName({ ...record, storageKey: key }));
  }
  return shifts.sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));
};

export const createScheduleShift = async (
  clientId: string,
  engagement: ServiceEngagement,
  raw: unknown
): Promise<ScheduleShiftWithProvider> => {
  const input = validateCreateScheduleShiftInput(raw);
  await assertProviderExists(input.providerId);

  const now = new Date().toISOString();
  const shiftId = randomUUID();
  const shift: ScheduleShift = {
    shiftId,
    engagementId: engagement.engagementId,
    packageId: input.packageId ?? null,
    providerId: input.providerId,
    shiftDate: input.shiftDate,
    hours: input.hours ?? null,
    shiftType: input.shiftType ?? "unknown",
    status: input.status ?? "scheduled",
    payoutBatchId: null,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const key = buildShiftKey(clientId, engagement.engagementId, shiftId);
  await writeJson(key, shift);
  return withProviderName({ ...shift, storageKey: key });
};

export const createScheduleShiftsFromLabel = async (
  clientId: string,
  engagement: ServiceEngagement,
  raw: unknown
): Promise<ScheduleShiftWithProvider[]> => {
  const input = validateCreateScheduleShiftsFromLabelInput(raw);
  await assertProviderExists(input.providerId);

  const dates = parseVisitDatesLabel(
    input.visitDatesLabel,
    engagement.scheduleYear
  );
  if (dates.length === 0) {
    throw new ScheduleValidationError("No visit dates could be parsed from label");
  }

  const existing = await listShiftsForEngagement(clientId, engagement.engagementId);
  const created: ScheduleShiftWithProvider[] = [];

  for (const shiftDate of dates) {
    const duplicate = existing.find(
      (shift) =>
        shift.shiftDate === shiftDate &&
        shift.providerId === input.providerId &&
        shift.status !== "cancelled"
    );
    if (duplicate) {
      created.push(duplicate);
      continue;
    }
    const shift = await createScheduleShift(clientId, engagement, {
      providerId: input.providerId,
      shiftDate,
      packageId: input.packageId,
      hours: input.hoursPerShift,
      shiftType: input.shiftType,
      status: "scheduled",
    });
    created.push(shift);
  }

  return created.sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));
};

export const updateScheduleShift = async (
  clientId: string,
  engagementId: string,
  shiftId: string,
  raw: unknown
): Promise<ScheduleShiftWithProvider> => {
  const updates = validateUpdateScheduleShiftInput(raw);
  if (updates.providerId) {
    await assertProviderExists(updates.providerId);
  }

  const key = buildShiftKey(clientId, engagementId, shiftId);
  const existing = await readJson<ScheduleShift>(key);
  if (!existing) throw new ScheduleValidationError("Shift not found");

  const next: ScheduleShift = {
    ...existing,
    providerId: updates.providerId ?? existing.providerId,
    shiftDate: updates.shiftDate ?? existing.shiftDate,
    packageId:
      updates.packageId !== undefined ? updates.packageId : existing.packageId,
    hours: updates.hours !== undefined ? updates.hours : existing.hours,
    shiftType: updates.shiftType ?? existing.shiftType,
    status: updates.status ?? existing.status,
    payoutBatchId:
      updates.payoutBatchId !== undefined
        ? updates.payoutBatchId
        : existing.payoutBatchId,
    notes: updates.notes !== undefined ? updates.notes : existing.notes,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(key, next);
  return withProviderName({ ...next, storageKey: key });
};

export const linkShiftsToPayoutBatch = async (
  clientId: string,
  engagementId: string,
  shiftIds: string[],
  payoutBatchId: string | null
): Promise<void> => {
  for (const shiftId of shiftIds) {
    await updateScheduleShift(clientId, engagementId, shiftId, {
      payoutBatchId,
    });
  }
};

export const readScheduleShift = async (
  clientId: string,
  engagementId: string,
  shiftId: string
): Promise<ScheduleShift | null> => {
  const key = buildShiftKey(clientId, engagementId, shiftId);
  const record = await readJson<ScheduleShift>(key);
  return record ? { ...record, storageKey: key } : null;
};
