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
import {
  parseFeeItemsInput,
  resolveServiceTotalFeeCents,
} from "@/lib/client-services/feeItems";
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
import { getClientById } from "@/lib/clients/storage";
import {
  buildEmptyInvoiceContactFields,
  dispatchServiceInvoice,
  InvoiceDispatchError,
} from "@/lib/invoices/dispatchInvoice";
import {
  normalizeStoredInvoiceAmounts,
  resolveInvoiceAmountFieldsFromInput,
} from "@/lib/invoices/processingFee";
import type {
  ClientService,
  ClientServiceWithInvoices,
  CreateClientServiceInput,
  CreateServiceInvoiceInput,
  InvoiceDispatchActor,
  ServiceInvoice,
  UpdateClientServiceInput,
  UpdateServiceInvoiceInput,
} from "@/types/clientService";

export class ClientServiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientServiceValidationError";
  }
}

export { InvoiceDispatchError } from "@/lib/invoices/dispatchInvoice";

export interface ServiceInvoiceDispatchOptions {
  actor: InvoiceDispatchActor;
  origin: string;
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
  if (!record) return null;
  return {
    ...record,
    feeItems: record.feeItems ?? [],
    storageKey: key,
  };
};

const resolveFeeItemsFromInput = (
  raw: CreateClientServiceInput | UpdateClientServiceInput,
  existing?: ClientService
): ClientService["feeItems"] => {
  if (raw.feeItems !== undefined) {
    try {
      return parseFeeItemsInput(raw.feeItems);
    } catch (error) {
      throw new ClientServiceValidationError(
        error instanceof Error ? error.message : "Invalid fee items"
      );
    }
  }
  return existing?.feeItems ?? [];
};

const resolveTotalFeeCentsFromInput = (
  feeItems: ClientService["feeItems"],
  raw: CreateClientServiceInput | UpdateClientServiceInput,
  existing?: ClientService
): number => {
  const explicitTotal =
    raw.totalFeeCents !== undefined
      ? parseMoneyCents(raw.totalFeeCents, "totalFeeCents")
      : existing?.totalFeeCents;

  try {
    return resolveServiceTotalFeeCents({
      feeItems,
      totalFeeCents: explicitTotal,
    });
  } catch (error) {
    throw new ClientServiceValidationError(
      error instanceof Error ? error.message : "Invalid service total fee"
    );
  }
};

const normalizeServiceInvoice = (
  record: ServiceInvoice,
  key: string
): ServiceInvoice => {
  const amounts = normalizeStoredInvoiceAmounts(record);
  return {
    ...record,
    ...amounts,
    customerName: record.customerName ?? "",
    customerEmail: record.customerEmail ?? "",
    paymentInstructions: record.paymentInstructions ?? "",
    paymentLink: record.paymentLink ?? null,
    documentStorageKey: record.documentStorageKey ?? null,
    pdfDownloadUrl: record.pdfDownloadUrl ?? null,
    pdfAccessExpiresAt: record.pdfAccessExpiresAt ?? null,
    notes: record.notes ?? "",
    lastEmailError: record.lastEmailError ?? null,
    storageKey: key,
  };
};

export const readServiceInvoice = async (
  clientId: string,
  serviceId: string,
  invoiceId: string
): Promise<ServiceInvoice | null> => {
  const key = buildServiceInvoiceKey(clientId, serviceId, invoiceId);
  const record = await readJson<ServiceInvoice>(key);
  return record ? normalizeServiceInvoice(record, key) : null;
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
  const feeItems = resolveFeeItemsFromInput(raw);
  const totalFeeCents = resolveTotalFeeCentsFromInput(feeItems, raw);
  const service: ClientService = {
    serviceId,
    clientId,
    title,
    providerName: String(raw.providerName ?? "").trim(),
    serviceDate: parseServiceDate(raw.serviceDate),
    totalFeeCents,
    feeItems,
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

  const feeItems = resolveFeeItemsFromInput(raw, existing);
  const totalFeeCents = resolveTotalFeeCentsFromInput(feeItems, raw, existing);

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
    totalFeeCents,
    feeItems,
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

const assertInvoiceSubtotalWithinBalance = async (
  clientId: string,
  serviceId: string,
  serviceTotalFeeCents: number,
  subtotalCents: number,
  excludeInvoiceId?: string
): Promise<void> => {
  const existingInvoices = await listInvoicesForService(clientId, serviceId);
  const filtered = excludeInvoiceId
    ? existingInvoices.filter((inv) => inv.invoiceId !== excludeInvoiceId)
    : existingInvoices;
  const balanceDue = computeServiceBalanceDueCents(
    serviceTotalFeeCents,
    filtered
  );
  if (subtotalCents > balanceDue) {
    throw new ClientServiceValidationError(
      `Invoice amount exceeds remaining balance (${balanceDue} cents)`
    );
  }
};

const mergeInvoiceFieldUpdates = (
  existing: ServiceInvoice,
  raw: UpdateServiceInvoiceInput
): ServiceInvoice => {
  const paymentMethod = raw.paymentMethod ?? existing.paymentMethod;
  if (raw.paymentMethod && !isKnownPaymentMethod(raw.paymentMethod)) {
    throw new ClientServiceValidationError("Unknown payment method");
  }

  let amountFields;
  try {
    amountFields = resolveInvoiceAmountFieldsFromInput({
      amountCents: raw.amountCents,
      applyProcessingFee: raw.applyProcessingFee,
      processingFeePercent: raw.processingFeePercent,
      paymentMethod,
      existing,
    });
  } catch (error) {
    throw new ClientServiceValidationError(
      error instanceof Error ? error.message : "Invalid invoice amount"
    );
  }

  if (amountFields.subtotalCents <= 0) {
    throw new ClientServiceValidationError("Invoice amount must be greater than zero");
  }

  return {
    ...existing,
    ...amountFields,
    description:
      raw.description !== undefined
        ? String(raw.description).trim()
        : existing.description,
    dueDate: raw.dueDate !== undefined ? raw.dueDate : existing.dueDate,
    paymentMethod,
    notes: raw.notes !== undefined ? String(raw.notes).trim() : existing.notes,
    updatedAt: new Date().toISOString(),
  };
};

const saveInvoice = async (
  clientId: string,
  serviceId: string,
  invoice: ServiceInvoice
): Promise<ServiceInvoice> => {
  const key = buildServiceInvoiceKey(clientId, serviceId, invoice.invoiceId);
  const saved = { ...invoice, storageKey: key };
  await writeJson(key, saved);
  return saved;
};

export const createServiceInvoice = async (
  clientId: string,
  serviceId: string,
  raw: CreateServiceInvoiceInput,
  dispatchOptions?: ServiceInvoiceDispatchOptions
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

  let amountFields;
  try {
    amountFields = resolveInvoiceAmountFieldsFromInput({
      amountCents: raw.amountCents,
      applyProcessingFee: raw.applyProcessingFee,
      processingFeePercent: raw.processingFeePercent,
      paymentMethod: paymentMethod as ServiceInvoice["paymentMethod"],
    });
  } catch (error) {
    throw new ClientServiceValidationError(
      error instanceof Error ? error.message : "Invalid invoice amount"
    );
  }

  if (amountFields.subtotalCents <= 0) {
    throw new ClientServiceValidationError("Invoice amount must be greater than zero");
  }

  await assertInvoiceSubtotalWithinBalance(
    clientId,
    serviceId,
    service.totalFeeCents,
    amountFields.subtotalCents
  );

  const now = new Date().toISOString();
  const invoiceId = crypto.randomUUID();
  const invoiceNumber = await allocateInvoiceNumber();
  const send = Boolean(raw.send);
  const client = await getClientById(clientId);

  let invoice: ServiceInvoice = {
    invoiceId,
    serviceId,
    clientId,
    invoiceNumber,
    ...amountFields,
    description:
      String(raw.description ?? "").trim() ||
      (raw.installmentIndex
        ? `Installment ${raw.installmentIndex}${raw.installmentTotal ? ` of ${raw.installmentTotal}` : ""}`
        : service.title),
    dueDate: raw.dueDate ?? null,
    paymentMethod,
    status: "draft",
    installmentIndex: raw.installmentIndex ?? null,
    installmentTotal: raw.installmentTotal ?? null,
    notes: String(raw.notes ?? "").trim(),
    quickbooks: null,
    stripe: null,
    ...buildEmptyInvoiceContactFields(client),
    sentAt: null,
    paidAt: null,
    createdAt: now,
    updatedAt: now,
  };

  invoice = await saveInvoice(clientId, serviceId, invoice);

  if (send) {
    if (!dispatchOptions) {
      throw new ClientServiceValidationError(
        "Invoice dispatch requires an authenticated actor"
      );
    }
    invoice = await dispatchServiceInvoice({
      clientId,
      serviceId,
      invoice,
      actor: dispatchOptions.actor,
      origin: dispatchOptions.origin,
    });
    invoice = await saveInvoice(clientId, serviceId, invoice);
  }

  return invoice;
};

export const updateServiceInvoice = async (
  clientId: string,
  serviceId: string,
  invoiceId: string,
  raw: UpdateServiceInvoiceInput,
  dispatchOptions?: ServiceInvoiceDispatchOptions
): Promise<ServiceInvoice> => {
  const existing = await readServiceInvoice(clientId, serviceId, invoiceId);
  if (!existing) throw new ClientServiceValidationError("Invoice not found");

  const service = await readClientService(clientId, serviceId);
  if (!service) throw new ClientServiceValidationError("Service not found");

  const now = new Date().toISOString();
  let status = raw.status ?? existing.status;
  let sentAt = existing.sentAt;
  let paidAt = existing.paidAt;
  let invoice: ServiceInvoice = { ...existing };

  const hasFieldEdits =
    raw.amountCents !== undefined ||
    raw.applyProcessingFee !== undefined ||
    raw.processingFeePercent !== undefined ||
    raw.description !== undefined ||
    raw.dueDate !== undefined ||
    raw.paymentMethod !== undefined ||
    raw.notes !== undefined;

  if (
    existing.status === "paid" &&
    hasFieldEdits &&
    (raw.amountCents !== undefined ||
      raw.applyProcessingFee !== undefined ||
      raw.processingFeePercent !== undefined ||
      raw.paymentMethod !== undefined ||
      raw.description !== undefined ||
      raw.dueDate !== undefined)
  ) {
    throw new ClientServiceValidationError(
      "Paid invoices cannot be edited. Use Resend to send a copy with updated notes."
    );
  }

  if (raw.markSent) {
    if (!dispatchOptions) {
      throw new ClientServiceValidationError(
        "Invoice dispatch requires an authenticated actor"
      );
    }
    const toSend = mergeInvoiceFieldUpdates(existing, raw);
    await assertInvoiceSubtotalWithinBalance(
      clientId,
      serviceId,
      service.totalFeeCents,
      toSend.subtotalCents,
      invoiceId
    );
    invoice = await dispatchServiceInvoice({
      clientId,
      serviceId,
      invoice: toSend,
      actor: dispatchOptions.actor,
      origin: dispatchOptions.origin,
    });
    return saveInvoice(clientId, serviceId, invoice);
  }

  if (raw.saveAndResend) {
    if (!dispatchOptions) {
      throw new ClientServiceValidationError(
        "Invoice dispatch requires an authenticated actor"
      );
    }
    if (
      existing.status !== "sent" &&
      existing.status !== "pending_payment"
    ) {
      throw new ClientServiceValidationError(
        "Only sent or pending invoices can be edited and resent"
      );
    }
    const toSend = mergeInvoiceFieldUpdates(existing, raw);
    await assertInvoiceSubtotalWithinBalance(
      clientId,
      serviceId,
      service.totalFeeCents,
      toSend.subtotalCents,
      invoiceId
    );
    invoice = await dispatchServiceInvoice({
      clientId,
      serviceId,
      invoice: toSend,
      actor: dispatchOptions.actor,
      origin: dispatchOptions.origin,
      resend: true,
    });
    return saveInvoice(clientId, serviceId, invoice);
  }

  if (raw.resend) {
    if (!dispatchOptions) {
      throw new ClientServiceValidationError(
        "Invoice dispatch requires an authenticated actor"
      );
    }
    if (existing.status === "draft" || existing.status === "cancelled") {
      throw new ClientServiceValidationError(
        "Only sent or paid invoices can be resent"
      );
    }
    const toSend: ServiceInvoice = {
      ...existing,
      notes:
        raw.notes !== undefined ? String(raw.notes).trim() : existing.notes,
    };
    invoice = await dispatchServiceInvoice({
      clientId,
      serviceId,
      invoice: toSend,
      actor: dispatchOptions.actor,
      origin: dispatchOptions.origin,
      resend: true,
    });
    return saveInvoice(clientId, serviceId, invoice);
  }

  if (raw.markPaid) {
    status = "paid";
    paidAt = now;
    if (!sentAt) sentAt = now;
  }

  if (hasFieldEdits) {
    invoice = mergeInvoiceFieldUpdates(existing, raw);
    if (
      raw.amountCents !== undefined ||
      raw.applyProcessingFee !== undefined ||
      raw.processingFeePercent !== undefined
    ) {
      await assertInvoiceSubtotalWithinBalance(
        clientId,
        serviceId,
        service.totalFeeCents,
        invoice.subtotalCents,
        invoiceId
      );
    }
  } else {
    invoice = { ...existing };
  }

  const updated: ServiceInvoice = {
    ...invoice,
    status,
    sentAt,
    paidAt,
    updatedAt: now,
  };

  return saveInvoice(clientId, serviceId, updated);
};

export const markServiceInvoicePaid = async (
  clientId: string,
  serviceId: string,
  invoiceId: string,
  payment: { provider: string; reference?: string }
): Promise<ServiceInvoice> => {
  const existing = await readServiceInvoice(clientId, serviceId, invoiceId);
  if (!existing) {
    throw new ClientServiceValidationError("Invoice not found");
  }
  if (existing.status === "paid") {
    return existing;
  }

  const now = new Date().toISOString();
  const updated: ServiceInvoice = {
    ...existing,
    status: "paid",
    paidAt: now,
    sentAt: existing.sentAt ?? now,
    stripe: {
      ...existing.stripe,
      paymentIntentId: payment.reference ?? existing.stripe?.paymentIntentId,
    },
    updatedAt: now,
  };

  return saveInvoice(clientId, serviceId, updated);
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
