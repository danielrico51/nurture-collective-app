import { randomUUID } from "crypto";
import { getClientsStorageMode } from "@/lib/clients/config";
import {
  createClientService,
  listClientServicesWithInvoices,
  readClientService,
  updateClientService,
} from "@/lib/client-services/storage";
import { getClientById } from "@/lib/clients/storage";
import { listLocalKeys, readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { readProvider } from "@/lib/providers/storage";
import {
  createProviderPayoutBatch,
  listPayoutsForEngagement,
  listProviderPayoutReport,
  updateProviderPayoutBatch,
} from "@/lib/schedule/payoutStorage";
import {
  createScheduleShift,
  createScheduleShiftsFromLabel,
  listShiftsForEngagement,
  updateScheduleShift,
} from "@/lib/schedule/shiftStorage";
import {
  buildEngagementKey,
  buildEngagementListPrefix,
  buildExpectationKey,
  buildExpectationListPrefix,
  buildPackageKey,
  buildPackageListPrefix,
  parseEngagementIdFromKey,
  parseExpectationIdFromKey,
  parsePackageIdFromKey,
} from "@/lib/schedule/paths";
import {
  ScheduleValidationError,
  validateCreateServiceEngagementInput,
  validateUpdateEngagementPackageInput,
  validateUpdatePaymentExpectationInput,
  validateUpdateServiceEngagementInput,
} from "@/lib/schedule/validation";
import type {
  ClientPaymentExpectation,
  CreatePaymentExpectationInput,
  CreateServiceEngagementInput,
  EngagementPackage,
  ServiceEngagement,
  ServiceEngagementWithDetails,
  UpdateEngagementPackageInput,
  UpdatePaymentExpectationInput,
  UpdateServiceEngagementInput,
} from "@/types/serviceEngagement";

export { ScheduleValidationError } from "@/lib/schedule/validation";

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

const serviceTypeLabel = (serviceType: ServiceEngagement["serviceType"]): string => {
  if (serviceType === "postpartum") return "Postpartum doula";
  if (serviceType === "birth") return "Birth doula";
  return "Service";
};

const sumPackageFees = (packages: EngagementPackage[]): number =>
  packages.reduce((sum, pkg) => sum + pkg.clientFeeCents, 0);

const readEngagementRecord = async (
  clientId: string,
  engagementId: string
): Promise<ServiceEngagement | null> => {
  const key = buildEngagementKey(clientId, engagementId);
  const record = await readJson<ServiceEngagement>(key);
  return record
    ? {
        ...record,
        preferredPaymentMethod: record.preferredPaymentMethod ?? null,
        storageKey: key,
      }
    : null;
};

const listEngagementIds = async (clientId: string): Promise<string[]> => {
  const prefix = buildEngagementListPrefix(clientId);
  const keys = await listKeys(prefix);
  const ids = new Set<string>();
  for (const key of keys) {
    if (!key.endsWith("/engagement.json")) continue;
    const id = parseEngagementIdFromKey(key);
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

const listPackagesForEngagement = async (
  clientId: string,
  engagementId: string
): Promise<EngagementPackage[]> => {
  const prefix = buildPackageListPrefix(clientId, engagementId);
  const keys = await listKeys(prefix);
  const packages: EngagementPackage[] = [];
  for (const key of keys) {
    if (!key.endsWith("/package.json")) continue;
    const record = await readJson<EngagementPackage>(key);
    if (record) packages.push({ ...record, storageKey: key });
  }
  return packages.sort((a, b) => a.sortOrder - b.sortOrder);
};

const listExpectationsForEngagement = async (
  clientId: string,
  engagementId: string
): Promise<ClientPaymentExpectation[]> => {
  const prefix = buildExpectationListPrefix(clientId, engagementId);
  const keys = await listKeys(prefix);
  const expectations: ClientPaymentExpectation[] = [];
  for (const key of keys) {
    if (!key.endsWith("/expectation.json")) continue;
    const record = await readJson<ClientPaymentExpectation>(key);
    if (record) expectations.push({ ...record, storageKey: key });
  }
  return expectations.sort((a, b) => a.kind.localeCompare(b.kind));
};

const saveExpectation = async (
  clientId: string,
  expectation: ClientPaymentExpectation
): Promise<ClientPaymentExpectation> => {
  const key = buildExpectationKey(
    clientId,
    expectation.engagementId,
    expectation.expectationId
  );
  await writeJson(key, expectation);
  return { ...expectation, storageKey: key };
};

const createExpectationRecord = async (
  clientId: string,
  engagementId: string,
  packageId: string,
  input: CreatePaymentExpectationInput
): Promise<ClientPaymentExpectation> => {
  const now = new Date().toISOString();
  const expectation: ClientPaymentExpectation = {
    expectationId: randomUUID(),
    engagementId,
    packageId,
    kind: input.kind,
    amountCents: input.amountCents,
    dueDate: input.dueDate ?? null,
    dueLabel: input.dueLabel ?? "",
    paidAt: input.paidAt ?? null,
    invoiceId: null,
    coverageProviderId: input.coverageProviderId ?? null,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  return saveExpectation(clientId, expectation);
};

const buildEngagementDetails = async (
  clientId: string,
  engagement: ServiceEngagement
): Promise<ServiceEngagementWithDetails> => {
  const packages = await listPackagesForEngagement(clientId, engagement.engagementId);
  const expectations = await listExpectationsForEngagement(
    clientId,
    engagement.engagementId
  );
  const shifts = await listShiftsForEngagement(clientId, engagement.engagementId);
  const payouts = await listPayoutsForEngagement(clientId, engagement.engagementId);
  const provider = engagement.primaryProviderId
    ? await readProvider(engagement.primaryProviderId)
    : null;
  const services = await listClientServicesWithInvoices(clientId);
  const service =
    services.find((item) => item.serviceId === engagement.serviceId) ?? null;

  return {
    ...engagement,
    packages,
    expectations,
    shifts,
    payouts,
    primaryProviderName: provider?.displayName ?? null,
    service,
    totalClientFeeCents: sumPackageFees(packages),
  };
};

export const listEngagementsForClient = async (
  clientId: string
): Promise<ServiceEngagementWithDetails[]> => {
  const client = await getClientById(clientId);
  if (!client) throw new ScheduleValidationError("Client not found");

  const ids = await listEngagementIds(clientId);
  const engagements: ServiceEngagementWithDetails[] = [];
  for (const engagementId of ids) {
    const record = await readEngagementRecord(clientId, engagementId);
    if (!record) continue;
    engagements.push(await buildEngagementDetails(clientId, record));
  }

  return engagements.sort(
    (a, b) => Date.parse(b.bookDate) - Date.parse(a.bookDate)
  );
};

export const getEngagementDetail = async (
  clientId: string,
  engagementId: string
): Promise<ServiceEngagementWithDetails | null> => {
  const record = await readEngagementRecord(clientId, engagementId);
  if (!record) return null;
  return buildEngagementDetails(clientId, record);
};

export const createServiceEngagement = async (
  clientId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  const input = validateCreateServiceEngagementInput(raw);
  const client = await getClientById(clientId);
  if (!client) throw new ScheduleValidationError("Client not found");

  const primaryProvider = input.primaryProviderId
    ? await readProvider(input.primaryProviderId)
    : null;
  if (input.primaryProviderId && !primaryProvider) {
    throw new ScheduleValidationError("Primary provider not found");
  }

  const packageProvider = input.package.providerId
    ? await readProvider(input.package.providerId)
    : null;
  if (input.package.providerId && !packageProvider) {
    throw new ScheduleValidationError("Package provider not found");
  }

  let serviceId = input.linkExistingServiceId ?? null;
  if (serviceId) {
    const linked = await readClientService(clientId, serviceId);
    if (!linked) {
      throw new ScheduleValidationError("Linked service not found");
    }
    if (linked.engagementId) {
      throw new ScheduleValidationError("Service is already linked to an engagement");
    }
  } else {
    const title =
      input.serviceTitle?.trim() ||
      `${serviceTypeLabel(input.serviceType ?? "postpartum")} ${input.scheduleYear}`;
    const created = await createClientService(clientId, {
      title,
      providerName: primaryProvider?.displayName ?? "",
      providerId: input.primaryProviderId ?? null,
      serviceDate: input.bookDate,
      totalFeeCents: input.package.clientFeeCents,
      status: "active",
      notes: input.package.notes ?? "",
    });
    serviceId = created.serviceId;
  }

  const now = new Date().toISOString();
  const engagementId = randomUUID();
  const engagement: ServiceEngagement = {
    engagementId,
    clientId,
    serviceId: serviceId!,
    serviceType: input.serviceType ?? "postpartum",
    scheduleYear: input.scheduleYear ?? Number(input.bookDate.slice(0, 4)),
    primaryProviderId: input.primaryProviderId ?? null,
    bookDate: input.bookDate,
    estimatedDate: input.estimatedDate ?? null,
    estimatedNotes: input.estimatedNotes ?? "",
    status: input.status ?? "booked",
    preferredPaymentMethod: input.preferredPaymentMethod ?? null,
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
    label: input.package.label ?? "Primary",
    clientFeeCents: input.package.clientFeeCents,
    hoursTotal: input.package.hoursTotal ?? null,
    hoursAnnotation: input.package.hoursAnnotation ?? "",
    schedulePattern: input.package.schedulePattern ?? "",
    doulaFeeCents: input.package.doulaFeeCents ?? null,
    providerId: input.package.providerId ?? input.primaryProviderId ?? null,
    notes: input.package.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const packageKey = buildPackageKey(clientId, engagementId, packageId);
  await writeJson(packageKey, { ...pkg, storageKey: packageKey });

  if (input.deposit) {
    await createExpectationRecord(clientId, engagementId, packageId, {
      ...input.deposit,
      kind: "deposit",
    });
  }
  if (input.balance) {
    await createExpectationRecord(clientId, engagementId, packageId, {
      ...input.balance,
      kind: "balance",
    });
  }

  await updateClientService(clientId, serviceId!, {
    engagementId,
    providerId: input.primaryProviderId ?? null,
    providerName: primaryProvider?.displayName,
    serviceDate: input.bookDate,
    totalFeeCents: input.package.clientFeeCents,
  });

  const saved = await readEngagementRecord(clientId, engagementId);
  if (!saved) throw new ScheduleValidationError("Failed to save engagement");
  return buildEngagementDetails(clientId, saved);
};

export const updateServiceEngagement = async (
  clientId: string,
  engagementId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  const updates = validateUpdateServiceEngagementInput(raw);
  const existing = await readEngagementRecord(clientId, engagementId);
  if (!existing) throw new ScheduleValidationError("Engagement not found");

  if (updates.primaryProviderId) {
    const provider = await readProvider(updates.primaryProviderId);
    if (!provider) throw new ScheduleValidationError("Primary provider not found");
  }

  const next: ServiceEngagement = {
    ...existing,
    serviceType: updates.serviceType ?? existing.serviceType,
    scheduleYear: updates.scheduleYear ?? existing.scheduleYear,
    primaryProviderId:
      updates.primaryProviderId !== undefined
        ? updates.primaryProviderId
        : existing.primaryProviderId,
    bookDate: updates.bookDate ?? existing.bookDate,
    estimatedDate:
      updates.estimatedDate !== undefined
        ? updates.estimatedDate
        : existing.estimatedDate,
    estimatedNotes:
      updates.estimatedNotes !== undefined
        ? updates.estimatedNotes
        : existing.estimatedNotes,
    status: updates.status ?? existing.status,
    preferredPaymentMethod:
      updates.preferredPaymentMethod !== undefined
        ? updates.preferredPaymentMethod
        : existing.preferredPaymentMethod ?? null,
    updatedAt: new Date().toISOString(),
  };

  const key = buildEngagementKey(clientId, engagementId);
  await writeJson(key, { ...next, storageKey: key });

  if (
    updates.primaryProviderId !== undefined ||
    updates.bookDate !== undefined
  ) {
    const provider = next.primaryProviderId
      ? await readProvider(next.primaryProviderId)
      : null;
    await updateClientService(clientId, existing.serviceId, {
      providerId: next.primaryProviderId,
      providerName: provider?.displayName,
      serviceDate: next.bookDate,
    });
  }

  return (await getEngagementDetail(clientId, engagementId))!;
};

export const updateEngagementPackage = async (
  clientId: string,
  engagementId: string,
  packageId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  const updates = validateUpdateEngagementPackageInput(raw);
  const engagement = await readEngagementRecord(clientId, engagementId);
  if (!engagement) throw new ScheduleValidationError("Engagement not found");

  const key = buildPackageKey(clientId, engagementId, packageId);
  const existing = await readJson<EngagementPackage>(key);
  if (!existing) throw new ScheduleValidationError("Package not found");

  const next: EngagementPackage = {
    ...existing,
    label: updates.label ?? existing.label,
    clientFeeCents: updates.clientFeeCents ?? existing.clientFeeCents,
    hoursTotal:
      updates.hoursTotal !== undefined ? updates.hoursTotal : existing.hoursTotal,
    hoursAnnotation:
      updates.hoursAnnotation !== undefined
        ? updates.hoursAnnotation
        : existing.hoursAnnotation,
    schedulePattern:
      updates.schedulePattern !== undefined
        ? updates.schedulePattern
        : existing.schedulePattern,
    doulaFeeCents:
      updates.doulaFeeCents !== undefined
        ? updates.doulaFeeCents
        : existing.doulaFeeCents,
    providerId:
      updates.providerId !== undefined ? updates.providerId : existing.providerId,
    notes: updates.notes !== undefined ? updates.notes : existing.notes,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(key, { ...next, storageKey: key });

  const packages = await listPackagesForEngagement(clientId, engagementId);
  await updateClientService(clientId, engagement.serviceId, {
    totalFeeCents: sumPackageFees(packages),
  });

  return (await getEngagementDetail(clientId, engagementId))!;
};

export const updatePaymentExpectation = async (
  clientId: string,
  engagementId: string,
  expectationId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  const updates = validateUpdatePaymentExpectationInput(raw);
  const engagement = await readEngagementRecord(clientId, engagementId);
  if (!engagement) throw new ScheduleValidationError("Engagement not found");

  const key = buildExpectationKey(clientId, engagementId, expectationId);
  const existing = await readJson<ClientPaymentExpectation>(key);
  if (!existing) throw new ScheduleValidationError("Payment expectation not found");

  const next: ClientPaymentExpectation = {
    ...existing,
    kind: updates.kind ?? existing.kind,
    amountCents: updates.amountCents ?? existing.amountCents,
    dueDate: updates.dueDate !== undefined ? updates.dueDate : existing.dueDate,
    dueLabel: updates.dueLabel !== undefined ? updates.dueLabel : existing.dueLabel,
    paidAt: updates.paidAt !== undefined ? updates.paidAt : existing.paidAt,
    invoiceId:
      updates.invoiceId !== undefined ? updates.invoiceId : existing.invoiceId,
    coverageProviderId:
      updates.coverageProviderId !== undefined
        ? updates.coverageProviderId
        : existing.coverageProviderId,
    notes: updates.notes !== undefined ? updates.notes : existing.notes,
    updatedAt: new Date().toISOString(),
  };
  await saveExpectation(clientId, next);

  return (await getEngagementDetail(clientId, engagementId))!;
};

export const readEngagementPackage = async (
  clientId: string,
  engagementId: string,
  packageId: string
): Promise<EngagementPackage | null> => {
  const key = buildPackageKey(clientId, engagementId, packageId);
  const record = await readJson<EngagementPackage>(key);
  return record ? { ...record, storageKey: key } : null;
};

export const readPaymentExpectation = async (
  clientId: string,
  engagementId: string,
  expectationId: string
): Promise<ClientPaymentExpectation | null> => {
  const key = buildExpectationKey(clientId, engagementId, expectationId);
  const record = await readJson<ClientPaymentExpectation>(key);
  return record ? { ...record, storageKey: key } : null;
};

export const listEngagementIdsForClient = listEngagementIds;

export const parseEngagementPackageIdFromKey = parsePackageIdFromKey;
export const parseEngagementExpectationIdFromKey = parseExpectationIdFromKey;

export {
  createProviderPayoutBatch,
  listProviderPayoutReport,
  updateProviderPayoutBatch,
};

export {
  createScheduleShift,
  createScheduleShiftsFromLabel,
  updateScheduleShift,
};

const requireEngagement = async (
  clientId: string,
  engagementId: string
): Promise<ServiceEngagement> => {
  const engagement = await readEngagementRecord(clientId, engagementId);
  if (!engagement) throw new ScheduleValidationError("Engagement not found");
  return engagement;
};

export const addScheduleShift = async (
  clientId: string,
  engagementId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  const engagement = await requireEngagement(clientId, engagementId);
  await createScheduleShift(clientId, engagement, raw);
  return (await getEngagementDetail(clientId, engagementId))!;
};

export const addScheduleShiftsFromLabel = async (
  clientId: string,
  engagementId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  const engagement = await requireEngagement(clientId, engagementId);
  await createScheduleShiftsFromLabel(clientId, engagement, raw);
  return (await getEngagementDetail(clientId, engagementId))!;
};

export const patchScheduleShift = async (
  clientId: string,
  engagementId: string,
  shiftId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  await requireEngagement(clientId, engagementId);
  await updateScheduleShift(clientId, engagementId, shiftId, raw);
  return (await getEngagementDetail(clientId, engagementId))!;
};

export const addProviderPayoutBatch = async (
  clientId: string,
  engagementId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  const engagement = await requireEngagement(clientId, engagementId);
  await createProviderPayoutBatch(clientId, engagement, raw);
  return (await getEngagementDetail(clientId, engagementId))!;
};

export const patchProviderPayoutBatch = async (
  clientId: string,
  engagementId: string,
  payoutBatchId: string,
  raw: unknown
): Promise<ServiceEngagementWithDetails> => {
  await requireEngagement(clientId, engagementId);
  await updateProviderPayoutBatch(clientId, engagementId, payoutBatchId, raw);
  return (await getEngagementDetail(clientId, engagementId))!;
};
