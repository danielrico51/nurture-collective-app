import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalKeys, readLocalJson } from "@/lib/clients/localStorage";
import { listClientsKeys, readClientsJson } from "@/lib/clients/platformS3";
import { syncDepositExpectationToServiceInvoice } from "@/lib/schedule/expectationBilling";
import {
  buildEngagementKey,
  buildExpectationListPrefix,
} from "@/lib/schedule/paths";
import type {
  ClientPaymentExpectation,
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

/** Backfill deposit invoices for one engagement (idempotent). */
export const ensureEngagementDepositInvoicesSynced = async (
  clientId: string,
  engagement: ServiceEngagement
): Promise<void> => {
  const expectations = await listExpectationsForEngagement(
    clientId,
    engagement.engagementId
  );

  for (const expectation of expectations) {
    if (expectation.kind !== "deposit" || expectation.amountCents <= 0) continue;
    try {
      await syncDepositExpectationToServiceInvoice(
        clientId,
        engagement.serviceId,
        engagement,
        expectation
      );
    } catch (error) {
      console.error("[schedule] deposit invoice sync failed", {
        clientId,
        engagementId: engagement.engagementId,
        expectationId: expectation.expectationId,
        error,
      });
    }
  }
};

export const ensureEngagementDepositInvoicesSyncedForId = async (
  clientId: string,
  engagementId: string
): Promise<void> => {
  const engagement = await readEngagementRecord(clientId, engagementId);
  if (!engagement?.serviceId) return;
  await ensureEngagementDepositInvoicesSynced(clientId, engagement);
};

export const ensureAllEngagementDepositInvoicesSynced = async (
  clientId: string,
  engagementIds: string[]
): Promise<void> => {
  for (const engagementId of engagementIds) {
    await ensureEngagementDepositInvoicesSyncedForId(clientId, engagementId);
  }
};
