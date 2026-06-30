import { getClientsStorageMode } from "@/lib/clients/config";
import { updateClientService } from "@/lib/client-services/storage";
import { listLocalKeys, readLocalJson } from "@/lib/clients/localStorage";
import { listClientsKeys, readClientsJson } from "@/lib/clients/platformS3";
import { syncExpectationToServiceInvoice } from "@/lib/schedule/expectationBilling";
import { syncEngagementLinkedServiceTotal } from "@/lib/schedule/engagementServiceSync";
import { buildLinkedServiceTitle } from "@/lib/schedule/serviceTitles";
import {
  buildEngagementKey,
  buildExpectationListPrefix,
  buildPackageListPrefix,
} from "@/lib/schedule/paths";
import type {
  ClientPaymentExpectation,
  EngagementPackage,
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
      }
    : null;
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
    if (record) expectations.push(record);
  }
  return expectations.sort((a, b) => a.kind.localeCompare(b.kind));
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
    if (record) packages.push(record);
  }
  return packages.sort((a, b) => a.sortOrder - b.sortOrder);
};

/** Backfill deposit/balance invoices for one engagement (idempotent). */
export const ensureEngagementPaymentInvoicesSynced = async (
  clientId: string,
  engagement: ServiceEngagement
): Promise<void> => {
  if (engagement.serviceId) {
    try {
      const packages = await listPackagesForEngagement(
        clientId,
        engagement.engagementId
      );
      await syncEngagementLinkedServiceTotal(clientId, engagement, packages);
      await updateClientService(clientId, engagement.serviceId, {
        title: buildLinkedServiceTitle(
          engagement.serviceType,
          engagement.scheduleYear
        ),
      });
    } catch (error) {
      console.error("[schedule] linked service sync failed", {
        clientId,
        engagementId: engagement.engagementId,
        serviceId: engagement.serviceId,
        error,
      });
    }
  }

  const expectations = await listExpectationsForEngagement(
    clientId,
    engagement.engagementId
  );

  for (const expectation of expectations) {
    if (
      (expectation.kind !== "deposit" && expectation.kind !== "balance") ||
      expectation.amountCents <= 0
    ) {
      continue;
    }
    try {
      await syncExpectationToServiceInvoice(
        clientId,
        engagement.serviceId,
        engagement,
        expectation
      );
    } catch (error) {
      console.error("[schedule] payment invoice sync failed", {
        clientId,
        engagementId: engagement.engagementId,
        expectationId: expectation.expectationId,
        kind: expectation.kind,
        error,
      });
    }
  }
};

/** @deprecated Use ensureEngagementPaymentInvoicesSynced */
export const ensureEngagementDepositInvoicesSynced = ensureEngagementPaymentInvoicesSynced;

export const ensureEngagementPaymentInvoicesSyncedForId = async (
  clientId: string,
  engagementId: string
): Promise<void> => {
  const engagement = await readEngagementRecord(clientId, engagementId);
  if (!engagement?.serviceId) return;
  await ensureEngagementPaymentInvoicesSynced(clientId, engagement);
};

/** @deprecated Use ensureEngagementPaymentInvoicesSyncedForId */
export const ensureEngagementDepositInvoicesSyncedForId =
  ensureEngagementPaymentInvoicesSyncedForId;

export const ensureAllEngagementPaymentInvoicesSynced = async (
  clientId: string,
  engagementIds: string[]
): Promise<void> => {
  for (const engagementId of engagementIds) {
    await ensureEngagementPaymentInvoicesSyncedForId(clientId, engagementId);
  }
};

/** @deprecated Use ensureAllEngagementPaymentInvoicesSynced */
export const ensureAllEngagementDepositInvoicesSynced =
  ensureAllEngagementPaymentInvoicesSynced;
