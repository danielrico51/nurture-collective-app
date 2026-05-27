import {
  appendLocalCoordinatorNote,
  appendLocalLeadProfile,
  getLatestLocalLeadProfile,
  listLocalLeadIds,
  listLocalNotesForLead,
} from "@/lib/leads/localStorage";
import {
  appendS3CoordinatorNote,
  appendS3LeadProfile,
  getLatestS3LeadProfile,
  getLeadsBucket,
  listS3LeadIds,
  listS3NotesForLead,
} from "@/lib/leads/platformS3";
import { buildLeadFromSources, canTransitionLeadStatus } from "@/lib/leads/workflow";
import type { ExtractedMaternalProfile } from "@/types/conversation";
import type { IntakeProfile } from "@/types/intake";
import type {
  CoordinatorNote,
  CoordinatorNoteType,
  CreateCoordinatorNoteInput,
  LeadRecord,
  LeadStatus,
  UpdateLeadInput,
} from "@/types/lead";

export const getLeadsStorageMode = (): "local" | "s3" => {
  if (process.env.LEADS_USE_LOCAL_STORAGE === "true") return "local";
  if (getLeadsBucket()) return "s3";
  return process.env.NODE_ENV === "development" ? "local" : "s3";
};

const saveLeadProfile = async (lead: LeadRecord): Promise<LeadRecord> => {
  const key =
    getLeadsStorageMode() === "local"
      ? await appendLocalLeadProfile(lead)
      : await appendS3LeadProfile(lead);
  return { ...lead, storageKey: key };
};

export const syncLeadFromIntake = async (input: {
  userId: string;
  intake?: IntakeProfile | null;
  extracted?: ExtractedMaternalProfile | null;
  conversationSessionId?: string | null;
  hasSubmittedIntake?: boolean;
}): Promise<LeadRecord> => {
  const existing = await getLeadById(input.userId);
  const lead = buildLeadFromSources({
    userId: input.userId,
    intake: input.intake,
    extracted: input.extracted,
    conversationSessionId: input.conversationSessionId,
    existing,
    hasSubmittedIntake: input.hasSubmittedIntake,
  });
  return saveLeadProfile(lead);
};

export const listAllLeads = async (): Promise<LeadRecord[]> => {
  const leadIds =
    getLeadsStorageMode() === "local"
      ? await listLocalLeadIds()
      : await listS3LeadIds();

  const leads = (
    await Promise.all(leadIds.map((id) => getLeadById(id)))
  ).filter((lead): lead is LeadRecord => lead !== null);

  return leads.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const getLeadById = async (leadId: string): Promise<LeadRecord | null> =>
  getLeadsStorageMode() === "local"
    ? getLatestLocalLeadProfile(leadId)
    : getLatestS3LeadProfile(leadId);

export const getLeadDetail = async (
  leadId: string
): Promise<{ lead: LeadRecord; notes: CoordinatorNote[] } | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) return null;
  const notes =
    getLeadsStorageMode() === "local"
      ? await listLocalNotesForLead(leadId)
      : await listS3NotesForLead(leadId);
  return { lead, notes };
};

export const addCoordinatorNote = async (
  leadId: string,
  author: { id: string; email?: string },
  input: CreateCoordinatorNoteInput
): Promise<CoordinatorNote> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error("Lead not found");

  const note: CoordinatorNote = {
    id: crypto.randomUUID(),
    leadId,
    authorId: author.id,
    authorEmail: author.email ?? "",
    body: input.body.trim(),
    type: input.type ?? "general",
    createdAt: new Date().toISOString(),
  };

  const key =
    getLeadsStorageMode() === "local"
      ? await appendLocalCoordinatorNote(note)
      : await appendS3CoordinatorNote(note);

  return { ...note, storageKey: key };
};

export const updateLead = async (
  leadId: string,
  input: UpdateLeadInput
): Promise<LeadRecord> => {
  const existing = await getLeadById(leadId);
  if (!existing) throw new Error("Lead not found");

  if (input.status && !canTransitionLeadStatus(existing.status, input.status)) {
    throw new Error(`Cannot transition from ${existing.status} to ${input.status}`);
  }

  const updated: LeadRecord = {
    ...existing,
    status: input.status ?? existing.status,
    coordinatorId: input.coordinatorId ?? existing.coordinatorId,
    coordinatorEmail: input.coordinatorEmail ?? existing.coordinatorEmail,
    updatedAt: new Date().toISOString(),
  };

  return saveLeadProfile(updated);
};

export const assignLeadToCoordinator = async (
  leadId: string,
  coordinator: { id: string; email?: string }
): Promise<LeadRecord> =>
  updateLead(leadId, {
    coordinatorId: coordinator.id,
    coordinatorEmail: coordinator.email,
    status: undefined,
  });

export const updateLeadStatus = async (
  leadId: string,
  status: LeadStatus
): Promise<LeadRecord> => updateLead(leadId, { status });
