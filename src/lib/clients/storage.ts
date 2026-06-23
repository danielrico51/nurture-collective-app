import {
  appendLocalClientCommunication,
  appendLocalClientNote,
  appendLocalClientProfile,
  deleteLocalJson,
  getLatestLocalClientProfile,
  listLocalClientIds,
  listLocalCommunicationsForClient,
  listLocalNotesForClient,
  readLocalClientEmailIndex,
  readLocalClientLeadIndex,
  writeLocalClientEmailIndex,
  writeLocalClientLeadIndex,
} from "@/lib/clients/localStorage";
import {
  appendS3ClientCommunication,
  appendS3ClientNote,
  appendS3ClientProfile,
  deleteClientsJson,
  getClientsCrmBucket,
  getLatestS3ClientProfile,
  listS3ClientIds,
  listS3CommunicationsForClient,
  listS3NotesForClient,
  readS3ClientEmailIndex,
  readS3ClientLeadIndex,
  writeS3ClientEmailIndex,
  writeS3ClientLeadIndex,
} from "@/lib/clients/platformS3";
import {
  buildClientByEmailIndexKey,
} from "@/lib/clients/paths";
import {
  propagateClientProfileChanges,
  validateUpdateClientInput,
  ClientUpdateValidationError,
} from "@/lib/clients/profileSync";
import { listClientServicesWithInvoices } from "@/lib/client-services/storage";
import {
  buildManualClientRecord,
  validateCreateClientInput,
} from "@/lib/clients/manualClient";
import {
  resolveCoordinatorAssignment,
} from "@/lib/leads/coordinatorAssignment";
import { getClientsStorageMode } from "@/lib/clients/config";
import { listPurchaseOrdersForClient } from "@/lib/billing/listOrders";
import { getLeadById } from "@/lib/leads/storage";
import { buildClientNotesSummaryFromLead } from "@/lib/leads/snapshotView";
import {
  listProposalIdsForClient,
  readProposalMetadata,
} from "@/lib/proposals/storage";
import { EMPTY_CLIENT_BILLING_SUMMARY } from "@/types/client";
import type {
  ClientCommunication,
  ClientDetailResponse,
  ClientNote,
  ClientRecord,
  CreateClientNoteInput,
  UpdateClientInput,
} from "@/types/client";
import type { LeadRecord } from "@/types/lead";
import type { ProposalMetadata } from "@/types/proposal";

export { getClientsStorageMode } from "@/lib/clients/config";

const updateClientIndexes = async (
  client: ClientRecord,
  previousEmail?: string
): Promise<void> => {
  const mode = getClientsStorageMode();
  if (client.leadId) {
    if (mode === "local") {
      await writeLocalClientLeadIndex(client.leadId, client.clientId);
    } else {
      await writeS3ClientLeadIndex(client.leadId, client.clientId);
    }
  }

  const previousKey = previousEmail?.trim().toLowerCase();
  const nextKey = client.email.trim().toLowerCase();
  if (previousKey && previousKey !== nextKey) {
    const oldIndexKey = buildClientByEmailIndexKey(previousEmail!);
    if (mode === "local") {
      await deleteLocalJson(oldIndexKey);
    } else {
      await deleteClientsJson(oldIndexKey);
    }
  }

  if (client.email) {
    if (mode === "local") {
      await writeLocalClientEmailIndex(client.email, client.clientId);
    } else {
      await writeS3ClientEmailIndex(client.email, client.clientId);
    }
  }
};

const saveClientProfile = async (
  client: ClientRecord
): Promise<ClientRecord> => {
  const key =
    getClientsStorageMode() === "local"
      ? await appendLocalClientProfile(client)
      : await appendS3ClientProfile(client);
  await updateClientIndexes(client);
  return { ...client, storageKey: key };
};

const saveClientProfileWithPreviousEmail = async (
  client: ClientRecord,
  previousEmail?: string
): Promise<ClientRecord> => {
  const key =
    getClientsStorageMode() === "local"
      ? await appendLocalClientProfile(client)
      : await appendS3ClientProfile(client);
  await updateClientIndexes(client, previousEmail);
  return { ...client, storageKey: key };
};

export const getClientById = async (
  clientId: string
): Promise<ClientRecord | null> =>
  getClientsStorageMode() === "local"
    ? getLatestLocalClientProfile(clientId)
    : getLatestS3ClientProfile(clientId);

const ensureClientRecord = async (clientId: string): Promise<ClientRecord> => {
  const client = await getClientById(clientId);
  if (!client) throw new Error("Client not found");
  return client;
};

export const listClients = async (): Promise<ClientRecord[]> => {
  const ids =
    getClientsStorageMode() === "local"
      ? await listLocalClientIds()
      : await listS3ClientIds();

  const clients = (
    await Promise.all(ids.map((id) => getClientById(id)))
  ).filter((client): client is ClientRecord => client !== null);

  return clients.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

const listProposalsForClient = async (
  clientId: string
): Promise<ProposalMetadata[]> => {
  try {
    const ids = await listProposalIdsForClient(clientId);
    const proposals = await Promise.all(
      ids.map((id) => readProposalMetadata(clientId, id))
    );
    return proposals
      .filter((proposal): proposal is ProposalMetadata => proposal !== null)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  } catch (error) {
    console.error("[clients] proposal load failed:", error);
    return [];
  }
};

export const listCommunicationsForClient = async (
  clientId: string
): Promise<ClientCommunication[]> =>
  getClientsStorageMode() === "local"
    ? listLocalCommunicationsForClient(clientId)
    : listS3CommunicationsForClient(clientId);

export const getClientDetail = async (
  clientId: string
): Promise<ClientDetailResponse | null> => {
  const client = await getClientById(clientId);
  if (!client) return null;

  const notes =
    getClientsStorageMode() === "local"
      ? await listLocalNotesForClient(clientId).catch((error) => {
          console.error("[clients] notes load failed:", error);
          return [] as ClientDetailResponse["notes"];
        })
      : await listS3NotesForClient(clientId).catch((error) => {
          console.error("[clients] notes load failed:", error);
          return [] as ClientDetailResponse["notes"];
        });

  let lead: LeadRecord | null = null;
  if (client.leadId) {
    try {
      lead = await getLeadById(client.leadId);
    } catch (error) {
      console.error("[clients] linked lead load failed:", error);
    }
  }

  const [proposals, communications, orders, services] = await Promise.all([
    listProposalsForClient(clientId),
    listCommunicationsForClient(clientId).catch((error) => {
      console.error("[clients] communications load failed:", error);
      return [] as ClientCommunication[];
    }),
    listPurchaseOrdersForClient(clientId).catch((error) => {
      console.error("[clients] billing orders load failed:", error);
      return [] as ClientDetailResponse["orders"];
    }),
    listClientServicesWithInvoices(clientId).catch((error) => {
      console.error("[clients] services load failed:", error);
      return [] as ClientDetailResponse["services"];
    }),
  ]);

  return { client, notes, lead, proposals, orders, services, communications };
};

export const createManualClient = async (
  rawInput: unknown,
  coordinator: { id: string; email?: string }
): Promise<ClientRecord> => {
  const payload = validateCreateClientInput(rawInput);
  const clientId = crypto.randomUUID();

  let assignedCoordinator: { id: string; email: string } | undefined;
  if (payload.coordinatorId) {
    const assignment = await resolveCoordinatorAssignment(payload.coordinatorId);
    assignedCoordinator = {
      id: assignment.coordinatorId,
      email: assignment.coordinatorEmail,
    };
  }

  const client = buildManualClientRecord({
    clientId,
    payload,
    coordinator: assignedCoordinator,
  });
  const saved = await saveClientProfile(client);

  const noteLines = [
    `Client manually entered by ${coordinator.email ?? "coordinator"}.`,
    `Channel: ${payload.channel}.`,
  ];
  if (payload.notes) noteLines.push(`Notes: ${payload.notes}`);

  try {
    await addClientNote(clientId, coordinator, {
      body: noteLines.join(" "),
      type: "general",
    });
  } catch (error) {
    console.error("[clients] manual client entry note failed:", error);
  }

  return saved;
};

export const addClientNote = async (
  clientId: string,
  author: { id: string; email?: string },
  input: CreateClientNoteInput
): Promise<ClientNote> => {
  await ensureClientRecord(clientId);

  const note: ClientNote = {
    id: crypto.randomUUID(),
    clientId,
    authorId: author.id,
    authorEmail: author.email ?? "",
    body: input.body.trim(),
    type: input.type ?? "general",
    createdAt: new Date().toISOString(),
  };

  const key =
    getClientsStorageMode() === "local"
      ? await appendLocalClientNote(note)
      : await appendS3ClientNote(note);

  return { ...note, storageKey: key };
};

export const recordClientCommunication = async (
  comm: Omit<ClientCommunication, "storageKey">
): Promise<ClientCommunication> => {
  const key =
    getClientsStorageMode() === "local"
      ? await appendLocalClientCommunication(comm)
      : await appendS3ClientCommunication(comm);
  return { ...comm, storageKey: key };
};

export const updateClient = async (
  clientId: string,
  input: UpdateClientInput
): Promise<ClientRecord> => {
  const existing = await ensureClientRecord(clientId);
  const validated = validateUpdateClientInput(input);

  const updated: ClientRecord = {
    ...existing,
    status: validated.status ?? existing.status,
    name: validated.name ?? existing.name,
    email: validated.email ?? existing.email,
    phone: validated.phone ?? existing.phone,
    coordinatorId:
      validated.coordinatorId !== undefined
        ? validated.coordinatorId
        : existing.coordinatorId,
    coordinatorEmail:
      validated.coordinatorEmail !== undefined
        ? validated.coordinatorEmail
        : existing.coordinatorEmail,
    locationZip:
      validated.locationZip !== undefined
        ? validated.locationZip
        : existing.locationZip,
    tags: validated.tags ?? existing.tags,
    notesSummary: validated.notesSummary ?? existing.notesSummary,
    archivedAt:
      validated.archivedAt !== undefined ? validated.archivedAt : existing.archivedAt,
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveClientProfileWithPreviousEmail(updated, existing.email);
  await propagateClientProfileChanges(existing, saved);
  return saved;
};

export { ClientUpdateValidationError } from "@/lib/clients/profileSync";

export const archiveClient = async (clientId: string): Promise<ClientRecord> =>
  updateClient(clientId, { archivedAt: new Date().toISOString() });

export const restoreClient = async (clientId: string): Promise<ClientRecord> =>
  updateClient(clientId, { archivedAt: null });

export const assignClientToCoordinator = async (
  clientId: string,
  coordinatorId: string
): Promise<ClientRecord> => {
  if (!coordinatorId) {
    return updateClient(clientId, { coordinatorId: "", coordinatorEmail: "" });
  }
  const assignment = await resolveCoordinatorAssignment(coordinatorId);
  return updateClient(clientId, {
    coordinatorId: assignment.coordinatorId,
    coordinatorEmail: assignment.coordinatorEmail,
  });
};

export const linkClientLead = async (
  clientId: string,
  leadId: string | null
): Promise<ClientRecord> => {
  const existing = await ensureClientRecord(clientId);
  const updated: ClientRecord = {
    ...existing,
    leadId: leadId || null,
    updatedAt: new Date().toISOString(),
  };
  return saveClientProfile(updated);
};

export const linkClientCognitoUser = async (
  clientId: string,
  cognitoSub: string | null
): Promise<ClientRecord> => {
  const existing = await ensureClientRecord(clientId);
  const updated: ClientRecord = {
    ...existing,
    cognitoSub: cognitoSub || null,
    updatedAt: new Date().toISOString(),
  };
  return saveClientProfile(updated);
};

export const findClientByLeadId = async (
  leadId: string
): Promise<ClientRecord | null> => {
  const mode = getClientsStorageMode();
  const indexedId =
    mode === "local"
      ? await readLocalClientLeadIndex(leadId)
      : await readS3ClientLeadIndex(leadId);

  if (indexedId) {
    const client = await getClientById(indexedId);
    if (client && client.leadId === leadId) return client;
  }

  const clients = await listClients();
  return clients.find((client) => client.leadId === leadId) ?? null;
};

export const findClientByEmail = async (
  email: string
): Promise<ClientRecord | null> => {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  const mode = getClientsStorageMode();
  const indexedId =
    mode === "local"
      ? await readLocalClientEmailIndex(email)
      : await readS3ClientEmailIndex(email);

  if (indexedId) {
    const client = await getClientById(indexedId);
    if (client && client.email.trim().toLowerCase() === target) return client;
  }

  const clients = await listClients();
  return (
    clients.find((client) => client.email.trim().toLowerCase() === target) ??
    null
  );
};

/** Resolve the CRM client record for a signed-in member (cognito link or matching email). */
export const findClientForMember = async (input: {
  cognitoSub: string;
  email: string;
}): Promise<ClientRecord | null> => {
  const sub = input.cognitoSub.trim();
  if (!sub) return null;

  const clients = await listClients();
  const bySub = clients.find((client) => client.cognitoSub === sub);
  if (bySub) return bySub;

  const byEmail = await findClientByEmail(input.email);
  if (byEmail && !byEmail.cognitoSub) return byEmail;

  return null;
};

const buildClientFromLead = (
  lead: LeadRecord,
  coordinator?: { id: string; email: string }
): ClientRecord => {
  const now = new Date().toISOString();
  return {
    clientId: crypto.randomUUID(),
    status: "prospect",
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    leadId: lead.leadId,
    cognitoSub: lead.isGuest ? null : lead.userId,
    source: "lead_conversion",
    coordinatorId: coordinator?.id ?? lead.coordinatorId ?? "",
    coordinatorEmail: coordinator?.email ?? lead.coordinatorEmail ?? "",
    tags: [],
    locationZip: lead.locationZip,
    notesSummary: buildClientNotesSummaryFromLead(lead),
    billing: { ...EMPTY_CLIENT_BILLING_SUMMARY },
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

/** Find an existing client for a lead or create one from the lead's data. */
export const ensureClientForLead = async (
  leadId: string,
  coordinator?: { id: string; email: string }
): Promise<ClientRecord> => {
  const existing = await findClientByLeadId(leadId);
  if (existing) return existing;

  const lead = await getLeadById(leadId);
  if (!lead) throw new Error("Lead not found");

  const client = buildClientFromLead(lead, coordinator);
  return saveClientProfile(client);
};

/**
 * Map an incoming proposal id (client UUID or legacy lead id) to the client id
 * that proposals are stored under. Read-only — never creates a client.
 */
export const resolveStorageClientId = async (id: string): Promise<string> => {
  const direct = await getClientById(id);
  if (direct) return id;
  const byLead = await findClientByLeadId(id);
  return byLead ? byLead.clientId : id;
};

/**
 * Resolve the client to generate a proposal for. If the id is a legacy lead id
 * with no client yet, a client is created from the lead.
 */
export const resolveClientForProposal = async (
  id: string
): Promise<ClientRecord> => {
  const direct = await getClientById(id);
  if (direct) return direct;
  return ensureClientForLead(id);
};

/**
 * Resolve (or create) a client for a lead during the proposals migration.
 * Falls back to a bare client when the original lead snapshot no longer exists.
 */
export const ensureMigratedClientForLead = async (
  leadId: string,
  fallback: { name?: string; email?: string; phone?: string } = {}
): Promise<ClientRecord> => {
  const existing = await findClientByLeadId(leadId);
  if (existing) return existing;

  const lead = await getLeadById(leadId);
  if (lead) return saveClientProfile(buildClientFromLead(lead));

  const now = new Date().toISOString();
  const client: ClientRecord = {
    clientId: crypto.randomUUID(),
    status: "active",
    name: fallback.name || "Migrated client",
    email: fallback.email || "",
    phone: fallback.phone || "",
    leadId,
    cognitoSub: null,
    source: "proposal_migration",
    coordinatorId: "",
    coordinatorEmail: "",
    tags: [],
    locationZip: null,
    notesSummary: "",
    billing: { ...EMPTY_CLIENT_BILLING_SUMMARY },
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  return saveClientProfile(client);
};

/** Convert a lead into a managed client (idempotent on the lead link). */
export const convertLeadToClient = async (
  leadId: string,
  coordinator: { id: string; email?: string }
): Promise<{ client: ClientRecord; created: boolean }> => {
  const existing = await findClientByLeadId(leadId);
  if (existing) return { client: existing, created: false };

  const lead = await getLeadById(leadId);
  if (!lead) throw new Error("Lead not found");

  let resolvedCoordinator: { id: string; email: string } | undefined;
  if (coordinator.id) {
    resolvedCoordinator = { id: coordinator.id, email: coordinator.email ?? "" };
  }

  const client = await ensureClientForLead(leadId, resolvedCoordinator);

  try {
    await addClientNote(client.clientId, coordinator, {
      body: `Converted from lead ${leadId} by ${coordinator.email ?? "coordinator"}.`,
      type: "general",
    });
  } catch (error) {
    console.error("[clients] conversion note failed:", error);
  }

  return { client, created: true };
};
