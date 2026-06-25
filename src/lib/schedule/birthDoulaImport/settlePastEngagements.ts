import { randomUUID } from "crypto";
import { getClientsStorageMode } from "@/lib/clients/config";
import {
  computeServiceBalanceDueCents,
  sumPaidInvoiceCents,
} from "@/lib/client-services/balances";
import {
  buildClientServiceKey,
  buildServiceInvoiceKey,
  buildServiceInvoiceListPrefix,
} from "@/lib/client-services/paths";
import { listLocalKeys, readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { buildClientListPrefix } from "@/lib/clients/paths";
import { getClientById } from "@/lib/clients/storage";
import { buildEmptyInvoiceContactFields } from "@/lib/invoices/dispatchInvoice";
import { BIRTH_SCHEDULE_IMPORT_FILE } from "@/lib/schedule/birthDoulaImport/constants";
import {
  engagementHasFutureServiceDate,
  todayIsoDate,
} from "@/lib/schedule/birthDoulaImport/clientStatus";
import {
  buildEngagementListPrefix,
  buildExpectationListPrefix,
  buildPayoutListPrefix,
} from "@/lib/schedule/paths";
import type { ClientService, ServiceInvoice } from "@/types/clientService";
import type {
  ClientPaymentExpectation,
  ProviderPayoutBatch,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const HISTORIC_SETTLEMENT_NOTE = "Historic birth schedule — marked paid on import.";

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

export const engagementHasPastServiceDate = (
  engagement: Pick<ServiceEngagement, "estimatedDate" | "bookDate">,
  today = todayIsoDate()
): boolean => !engagementHasFutureServiceDate(engagement, today);

const toPaidAt = (date: string | null | undefined): string | null => {
  if (!date) return null;
  if (date.includes("T")) return date;
  return `${date}T12:00:00.000Z`;
};

const resolveSettlementPaidAt = (
  engagement: ServiceEngagement,
  fallbackDate?: string | null
): string => {
  return (
    toPaidAt(fallbackDate) ??
    toPaidAt(engagement.estimatedDate) ??
    toPaidAt(engagement.bookDate) ??
    new Date().toISOString()
  );
};

const readClientService = async (
  clientId: string,
  serviceId: string
): Promise<ClientService | null> =>
  readJson<ClientService>(buildClientServiceKey(clientId, serviceId));

const listInvoicesForService = async (
  clientId: string,
  serviceId: string
): Promise<ServiceInvoice[]> => {
  const prefix = buildServiceInvoiceListPrefix(clientId, serviceId);
  const keys = (await listKeys(prefix)).filter((key) => key.endsWith("/invoice.json"));
  const invoices: ServiceInvoice[] = [];
  for (const key of keys) {
    const record = await readJson<ServiceInvoice>(key);
    if (record) invoices.push({ ...record, storageKey: key });
  }
  return invoices;
};

const ensureHistoricSettlementInvoice = async (
  engagement: ServiceEngagement
): Promise<boolean> => {
  const service = await readClientService(engagement.clientId, engagement.serviceId);
  if (!service) return false;

  const invoices = await listInvoicesForService(
    engagement.clientId,
    engagement.serviceId
  );
  const balanceDueCents = computeServiceBalanceDueCents(
    service.totalFeeCents,
    invoices
  );
  if (balanceDueCents <= 0) return false;

  const client = await getClientById(engagement.clientId);
  const now = new Date().toISOString();
  const invoiceId = randomUUID();
  const paidAt = resolveSettlementPaidAt(engagement);
  const invoice: ServiceInvoice = {
    invoiceId,
    serviceId: service.serviceId,
    clientId: engagement.clientId,
    invoiceNumber: `HIST-${engagement.scheduleYear}-${invoiceId.slice(0, 8).toUpperCase()}`,
    subtotalCents: balanceDueCents,
    processingFeeCents: 0,
    processingFeePercent: null,
    amountCents: balanceDueCents,
    description: `${service.title} — historic settlement`,
    dueDate: engagement.estimatedDate ?? engagement.bookDate,
    paymentMethod: "zelle",
    status: "paid",
    installmentIndex: null,
    installmentTotal: null,
    notes: HISTORIC_SETTLEMENT_NOTE,
    quickbooks: null,
    stripe: null,
    ...buildEmptyInvoiceContactFields(client),
    sentAt: paidAt,
    paidAt,
    createdAt: now,
    updatedAt: now,
  };

  const key = buildServiceInvoiceKey(
    engagement.clientId,
    engagement.serviceId,
    invoiceId
  );
  await writeJson(key, { ...invoice, storageKey: key });
  return true;
};

const settleExpectations = async (
  clientId: string,
  engagement: ServiceEngagement
): Promise<number> => {
  const prefix = buildExpectationListPrefix(clientId, engagement.engagementId);
  const keys = (await listKeys(prefix)).filter((key) =>
    key.endsWith("/expectation.json")
  );
  let updated = 0;

  for (const key of keys) {
    const expectation = await readJson<ClientPaymentExpectation>(key);
    if (!expectation || expectation.paidAt) continue;

    const paidAt = resolveSettlementPaidAt(
      engagement,
      expectation.dueDate ?? engagement.bookDate
    );
    await writeJson(key, {
      ...expectation,
      paidAt,
      notes: expectation.notes || HISTORIC_SETTLEMENT_NOTE,
      updatedAt: new Date().toISOString(),
      storageKey: key,
    });
    updated += 1;
  }

  return updated;
};

const settlePayouts = async (
  clientId: string,
  engagement: ServiceEngagement
): Promise<number> => {
  const prefix = buildPayoutListPrefix(clientId, engagement.engagementId);
  const keys = (await listKeys(prefix)).filter((key) => key.endsWith("/payout.json"));
  let updated = 0;

  for (const key of keys) {
    const payout = await readJson<ProviderPayoutBatch>(key);
    if (!payout || payout.status === "paid") continue;

    const paidAt = payout.paidAt ?? resolveSettlementPaidAt(engagement);
    await writeJson(key, {
      ...payout,
      status: "paid",
      paidAt,
      notes: payout.notes || HISTORIC_SETTLEMENT_NOTE,
      updatedAt: new Date().toISOString(),
      storageKey: key,
    });
    updated += 1;
  }

  return updated;
};

export interface SettlePastHistoricEngagementsResult {
  scanned: number;
  settled: number;
  expectationsMarkedPaid: number;
  payoutsMarkedPaid: number;
  settlementInvoicesCreated: number;
  skippedFuture: number;
}

export const settlePastHistoricEngagements = async (options?: {
  today?: string;
  dryRun?: boolean;
}): Promise<SettlePastHistoricEngagementsResult> => {
  const today = options?.today ?? todayIsoDate();
  const dryRun = options?.dryRun ?? false;

  const result: SettlePastHistoricEngagementsResult = {
    scanned: 0,
    settled: 0,
    expectationsMarkedPaid: 0,
    payoutsMarkedPaid: 0,
    settlementInvoicesCreated: 0,
    skippedFuture: 0,
  };

  const engagementKeys = (await listKeys(buildClientListPrefix())).filter((key) =>
    key.endsWith("/engagement.json")
  );

  for (const key of engagementKeys) {
    const engagement = await readJson<ServiceEngagement>(key);
    if (engagement?.importSource?.file !== BIRTH_SCHEDULE_IMPORT_FILE) continue;

    result.scanned += 1;

    if (engagementHasFutureServiceDate(engagement, today)) {
      result.skippedFuture += 1;
      continue;
    }

    if (dryRun) {
      const expectations = (await listKeys(
        buildExpectationListPrefix(engagement.clientId, engagement.engagementId)
      )).filter((item) => item.endsWith("/expectation.json"));
      for (const expectationKey of expectations) {
        const expectation = await readJson<ClientPaymentExpectation>(expectationKey);
        if (expectation && !expectation.paidAt) {
          result.expectationsMarkedPaid += 1;
        }
      }

      const payouts = (await listKeys(
        buildPayoutListPrefix(engagement.clientId, engagement.engagementId)
      )).filter((item) => item.endsWith("/payout.json"));
      for (const payoutKey of payouts) {
        const payout = await readJson<ProviderPayoutBatch>(payoutKey);
        if (payout && payout.status !== "paid") {
          result.payoutsMarkedPaid += 1;
        }
      }

      const service = await readClientService(engagement.clientId, engagement.serviceId);
      if (service) {
        const invoices = await listInvoicesForService(
          engagement.clientId,
          engagement.serviceId
        );
        if (
          computeServiceBalanceDueCents(service.totalFeeCents, invoices) > 0
        ) {
          result.settlementInvoicesCreated += 1;
        }
      }

      result.settled += 1;
      continue;
    }

    result.expectationsMarkedPaid += await settleExpectations(
      engagement.clientId,
      engagement
    );
    result.payoutsMarkedPaid += await settlePayouts(
      engagement.clientId,
      engagement
    );

    if (await ensureHistoricSettlementInvoice(engagement)) {
      result.settlementInvoicesCreated += 1;
    }

    result.settled += 1;
  }

  return result;
};

export const engagementServiceIsFullyPaid = async (
  engagement: ServiceEngagement
): Promise<boolean> => {
  const service = await readClientService(engagement.clientId, engagement.serviceId);
  if (!service) return true;
  const invoices = await listInvoicesForService(
    engagement.clientId,
    engagement.serviceId
  );
  return computeServiceBalanceDueCents(service.totalFeeCents, invoices) <= 0;
};

export { sumPaidInvoiceCents };
