import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalKeys, readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import {
  computeServiceBalanceDueCents,
  sumPaidInvoiceCents,
} from "@/lib/client-services/balances";
import { allocateInvoiceNumber } from "@/lib/client-services/invoiceSequence";
import {
  buildClientServiceKey,
  buildClientServiceListPrefix,
  buildServiceInvoiceKey,
  buildServiceInvoiceListPrefix,
  CLIENT_SERVICE_FILENAME,
  parseInvoiceIdFromKey,
  parseServiceIdFromKey,
  SERVICE_INVOICE_FILENAME,
} from "@/lib/client-services/paths";
import { isKnownPaymentMethod } from "@/config/paymentMethods";
import type {
  ClientService,
  ClientServiceWithInvoices,
  CreateClientServiceInput,
  CreateServiceInvoiceInput,
  ServiceInvoice,
  UpdateClientServiceInput,
  UpdateServiceInvoiceInput,
} from "@/types/clientService";
import { getClientById } from "@/lib/clients/storage";

export class ClientServiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientServiceValidationError";
  }
}

const parseMoneyCents = (value: unknown, field: string): number => {
  const cents = Number(value);
  if (!Number.isFinite(cents) || cents < 0) {
    throw new ClientServiceValidationError(`${field} must be a non-negative amount`);
  }
  return Math.round(cents);
};

const parseServiceDate = (value: unknown): string => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const date = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ClientServiceValidationError("serviceDate must be YYYY-MM-DD");
  }
  return date;
};

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

export const readClientService = async (
  clientId: string,
  serviceId: string
): Promise<ClientService | null> => {
  const key = buildClientServiceKey(clientId, serviceId);
  const record = await readJson<ClientService>(key);
  return record ? { ...record, storageKey: key } : null;
};

export const readServiceInvoice = async (
  clientId: string,
  serviceId: string,
  invoiceId: string
): Promise<ServiceInvoice | null> => {
  const key = buildServiceInvoiceKey(clientId, serviceId, invoiceId);
  const record = await readJson<ServiceInvoice>(key);
  return record ? { ...record, storageKey: key } : null;
};

export const listServiceIdsForClient = async (
  clientId: string
): Promise<string[]> => {
  const prefix = buildClientServiceListPrefix(clientId);
  const keys = await listKeys(prefix);
  const ids = new Set<string>();
  for (const key of keys) {
    if (!key.endsWith(`/${CLIENT_SERVICE_FILENAME}`)) continue;
    const id = parseServiceIdFromKey(key);
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

export const listInvoiceIdsForService = async (
  clientId: string,
  serviceId: string
): Promise<string[]> => {
  const prefix = buildServiceInvoiceListPrefix(clientId, serviceId);
  const keys = await listKeys(prefix);
  const ids = new Set<string>();
  for (const key of keys) {
    if (!key.endsWith(`/${SERVICE_INVOICE_FILENAME}`)) continue;
    const id = parseInvoiceIdFromKey(key);
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

export const listInvoicesForService = async (
  clientId: string,
  serviceId: string
): Promise<ServiceInvoice[]> => {
  const ids = await listInvoiceIdsForService(clientId, serviceId);
  const invoices = await Promise.all(
    ids.map((id) => readServiceInvoice(clientId, serviceId, id))
  );
  return invoices
    .filter((invoice): invoice is ServiceInvoice => invoice !== null)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

export const listClientServicesWithInvoices = async (
  clientId: string
): Promise<ClientServiceWithInvoices[]> => {
  const serviceIds = await listServiceIdsForClient(clientId);
  const services = await Promise.all(
    serviceIds.map(async (serviceId) => {
      const service = await readClientService(clientId, serviceId);
      if (!service) return null;
      const invoices = await listInvoicesForService(clientId, serviceId);
      const paidCents = sumPaidInvoiceCents(invoices);
      const balanceDueCents = computeServiceBalanceDueCents(
        service.totalFeeCents,
        invoices
      );
      return { ...service, invoices, paidCents, balanceDueCents };
    })
  );
  return services
    .filter((service): service is ClientServiceWithInvoices => service !== null)
    .sort((a, b) => Date.parse(b.serviceDate) - Date.parse(a.serviceDate));
};

export const createClientService = async (
  clientId: string,
  raw: CreateClientServiceInput
): Promise<ClientService> => {
  const client = await getClientById(clientId);
  if (!client) throw new ClientServiceValidationError("Client not found");

  const title = String(raw.title ?? "").trim();
  if (!title) {
    throw new ClientServiceValidationError("Service title is required");
  }

  const now = new Date().toISOString();
  const serviceId = crypto.randomUUID();
  const key = buildClientServiceKey(clientId, serviceId);
  const service: ClientService = {
    serviceId,
    clientId,
    title,
    providerName: String(raw.providerName ?? "").trim(),
    serviceDate: parseServiceDate(raw.serviceDate),
    totalFeeCents: parseMoneyCents(raw.totalFeeCents, "totalFeeCents"),
    proposalId: raw.proposalId ?? null,
    googleDocUrl: raw.googleDocUrl?.trim() || null,
    status: raw.status ?? "active",
    notes: String(raw.notes ?? "").trim(),
    createdAt: now,
    updatedAt: now,
  };

  await writeJson(key, { ...service, storageKey: key });
  return { ...service, storageKey: key };
};

export const updateClientService = async (
  clientId: string,
  serviceId: string,
  raw: UpdateClientServiceInput
): Promise<ClientService> => {
  const existing = await readClientService(clientId, serviceId);
  if (!existing) throw new ClientServiceValidationError("Service not found");

  const updated: ClientService = {
    ...existing,
    title: raw.title !== undefined ? String(raw.title).trim() : existing.title,
    providerName:
      raw.providerName !== undefined
        ? String(raw.providerName).trim()
        : existing.providerName,
    serviceDate:
      raw.serviceDate !== undefined
        ? parseServiceDate(raw.serviceDate)
        : existing.serviceDate,
    totalFeeCents:
      raw.totalFeeCents !== undefined
        ? parseMoneyCents(raw.totalFeeCents, "totalFeeCents")
        : existing.totalFeeCents,
    proposalId:
      raw.proposalId !== undefined ? raw.proposalId : existing.proposalId,
    googleDocUrl:
      raw.googleDocUrl !== undefined
        ? raw.googleDocUrl?.trim() || null
        : existing.googleDocUrl,
    status: raw.status ?? existing.status,
    notes: raw.notes !== undefined ? String(raw.notes).trim() : existing.notes,
    updatedAt: new Date().toISOString(),
  };

  if (!updated.title) {
    throw new ClientServiceValidationError("Service title is required");
  }

  const key = buildClientServiceKey(clientId, serviceId);
  await writeJson(key, { ...updated, storageKey: key });
  return { ...updated, storageKey: key };
};

const resolveInitialInvoiceStatus = (
  input: CreateServiceInvoiceInput,
  send: boolean
): ServiceInvoice["status"] => {
  if (send) {
    const method = String(input.paymentMethod);
    if (method === "quickbooks" || method === "stripe") {
      return "pending_payment";
    }
    return "sent";
  }
  return "draft";
};

export const createServiceInvoice = async (
  clientId: string,
  serviceId: string,
  raw: CreateServiceInvoiceInput
): Promise<ServiceInvoice> => {
  const service = await readClientService(clientId, serviceId);
  if (!service) throw new ClientServiceValidationError("Service not found");

  const paymentMethod = String(raw.paymentMethod ?? "").trim();
  if (!paymentMethod) {
    throw new ClientServiceValidationError("paymentMethod is required");
  }
  if (!isKnownPaymentMethod(paymentMethod)) {
    throw new ClientServiceValidationError("Unknown payment method");
  }

  const amountCents = parseMoneyCents(raw.amountCents, "amountCents");
  if (amountCents <= 0) {
    throw new ClientServiceValidationError("Invoice amount must be greater than zero");
  }

  const existingInvoices = await listInvoicesForService(clientId, serviceId);
  const balanceDue = computeServiceBalanceDueCents(
    service.totalFeeCents,
    existingInvoices
  );
  if (amountCents > balanceDue) {
    throw new ClientServiceValidationError(
      `Invoice amount exceeds remaining balance (${balanceDue} cents)`
    );
  }

  const now = new Date().toISOString();
  const invoiceId = crypto.randomUUID();
  const invoiceNumber = await allocateInvoiceNumber();
  const send = Boolean(raw.send);
  const status = resolveInitialInvoiceStatus(raw, send);

  const invoice: ServiceInvoice = {
    invoiceId,
    serviceId,
    clientId,
    invoiceNumber,
    amountCents,
    description:
      String(raw.description ?? "").trim() ||
      (raw.installmentIndex
        ? `Installment ${raw.installmentIndex}${raw.installmentTotal ? ` of ${raw.installmentTotal}` : ""}`
        : service.title),
    dueDate: raw.dueDate ?? null,
    paymentMethod,
    status,
    installmentIndex: raw.installmentIndex ?? null,
    installmentTotal: raw.installmentTotal ?? null,
    quickbooks: null,
    stripe: null,
    sentAt: send ? now : null,
    paidAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const key = buildServiceInvoiceKey(clientId, serviceId, invoiceId);
  await writeJson(key, { ...invoice, storageKey: key });
  return { ...invoice, storageKey: key };
};

export const updateServiceInvoice = async (
  clientId: string,
  serviceId: string,
  invoiceId: string,
  raw: UpdateServiceInvoiceInput
): Promise<ServiceInvoice> => {
  const existing = await readServiceInvoice(clientId, serviceId, invoiceId);
  if (!existing) throw new ClientServiceValidationError("Invoice not found");

  const now = new Date().toISOString();
  let status = raw.status ?? existing.status;
  let sentAt = existing.sentAt;
  let paidAt = existing.paidAt;

  if (raw.markSent) {
    status =
      existing.paymentMethod === "quickbooks" ||
      existing.paymentMethod === "stripe"
        ? "pending_payment"
        : "sent";
    sentAt = now;
  }

  if (raw.markPaid) {
    status = "paid";
    paidAt = now;
    if (!sentAt) sentAt = now;
  }

  const updated: ServiceInvoice = {
    ...existing,
    amountCents:
      raw.amountCents !== undefined
        ? parseMoneyCents(raw.amountCents, "amountCents")
        : existing.amountCents,
    description:
      raw.description !== undefined
        ? String(raw.description).trim()
        : existing.description,
    dueDate: raw.dueDate !== undefined ? raw.dueDate : existing.dueDate,
    paymentMethod: raw.paymentMethod ?? existing.paymentMethod,
    status,
    sentAt,
    paidAt,
    updatedAt: now,
  };

  const key = buildServiceInvoiceKey(clientId, serviceId, invoiceId);
  await writeJson(key, { ...updated, storageKey: key });
  return { ...updated, storageKey: key };
};

export const getClientServiceWithInvoices = async (
  clientId: string,
  serviceId: string
): Promise<ClientServiceWithInvoices | null> => {
  const service = await readClientService(clientId, serviceId);
  if (!service) return null;
  const invoices = await listInvoicesForService(clientId, serviceId);
  return {
    ...service,
    invoices,
    paidCents: sumPaidInvoiceCents(invoices),
    balanceDueCents: computeServiceBalanceDueCents(
      service.totalFeeCents,
      invoices
    ),
  };
};
