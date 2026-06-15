import { buildCoordinatorPrepFromSession } from "@/lib/leads/coordinatorPrep";
import {
  getConversationSession,
  getLatestConversationForUser,
} from "@/lib/conversation/storage";
import { getIntakeForUser, listAllIntakes } from "@/lib/intake/storage";
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
import { notifyLeadPipelineEvent } from "@/lib/integrations/slack/pipeline";
import {
  buildManualLeadRecord,
  validateManualLeadInput,
} from "@/lib/leads/manualLead";
import { resolveCoordinatorAssignment } from "@/lib/leads/coordinatorAssignment";
import {
  buildLeadFromSources,
  canAdminOverrideLeadStatus,
  isGuestLead,
} from "@/lib/leads/workflow";
import { formatConsultBookingSummary } from "@/lib/scheduling/bookingSummary";
import type { ConsultBooking } from "@/lib/scheduling/types";
import type { ExtractedMaternalProfile } from "@/types/conversation";
import type { IntakeProfile } from "@/types/intake";
import type {
  CoordinatorNote,
  CoordinatorNoteType,
  CreateCoordinatorNoteInput,
  LeadConversationPrep,
  LeadDetailResponse,
  LeadRecord,
  LeadStatus,
  UpdateLeadInput,
} from "@/types/lead";

export const getLeadsStorageMode = (): "local" | "s3" => {
  if (process.env.LEADS_USE_LOCAL_STORAGE === "true") return "local";
  if (process.env.LEADS_USE_S3 === "true" && getLeadsBucket()) return "s3";
  if (!getLeadsBucket()) {
    return process.env.NODE_ENV === "development" ? "local" : "s3";
  }
  // Bucket configured: default to local in dev (matches intake storage), S3 in prod.
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
  const saved = await saveLeadProfile(lead);

  void notifyLeadPipelineEvent({
    previous: existing,
    current: saved,
    hasSubmittedIntake: input.hasSubmittedIntake,
  }).catch((error) => {
    console.error("[leads] Slack notification failed:", error);
  });

  return saved;
};

/** Update CRM when a concierge introductory call is booked. */
export const syncLeadFromConsultBooking = async (input: {
  userId: string;
  userEmail?: string | null;
  booking: ConsultBooking;
}): Promise<{ lead: LeadRecord; isNewConsultSchedule: boolean }> => {
  const existing = await getLeadById(input.userId);
  const isNewConsultSchedule = existing?.status !== "consult_scheduled";

  let intake: IntakeProfile | null = null;
  if (!isGuestLead(input.userId)) {
    try {
      const data = await getIntakeForUser(input.userId, input.userEmail ?? undefined);
      intake = data.profile;
    } catch (error) {
      console.error("[leads] intake profile load failed:", error);
    }
  }

  let extracted: ExtractedMaternalProfile | null = null;
  let conversationSessionId = input.booking.conversationSessionId ?? null;

  try {
    if (conversationSessionId) {
      const session = await getConversationSession(
        input.userId,
        conversationSessionId,
        input.userEmail
      );
      extracted = session?.extractedProfile ?? null;
    } else {
      const session = await getLatestConversationForUser(
        input.userId,
        input.userEmail
      );
      if (session) {
        extracted = session.extractedProfile ?? null;
        conversationSessionId = session.id;
      }
    }
  } catch (error) {
    console.error("[leads] conversation prep failed:", error);
  }

  const base = buildLeadFromSources({
    userId: input.userId,
    intake,
    extracted,
    conversationSessionId,
    existing,
    hasConsultScheduled: true,
  });

  const saved = await saveLeadProfile({
    ...base,
    status: "consult_scheduled",
    name: input.booking.attendeeName || base.name,
    email: input.booking.attendeeEmail || base.email,
  });

  if (isNewConsultSchedule) {
    try {
      await addCoordinatorNote(
        input.userId,
        { id: "concierge-scheduling", email: "concierge@nesting-place.com" },
        {
          body: formatConsultBookingSummary(input.booking),
          type: "call_log",
        }
      );
    } catch (error) {
      console.error("[leads] consult booking note failed:", error);
    }
  }

  void notifyLeadPipelineEvent({
    previous: existing,
    current: saved,
    skipStatusChange: true,
  }).catch((error) => {
    console.error("[leads] Slack notification failed:", error);
  });

  return { lead: saved, isNewConsultSchedule };
};

/** Coordinator-entered lead from phone, referral, email, or other non-intake channels. */
export const createManualLead = async (
  rawInput: unknown,
  coordinator: { id: string; email?: string }
): Promise<LeadRecord> => {
  const payload = validateManualLeadInput(rawInput);
  const leadId = crypto.randomUUID();
  let assignedCoordinator: { id: string; email: string } | undefined;
  if (payload.coordinatorId) {
    const assignment = await resolveCoordinatorAssignment(payload.coordinatorId);
    assignedCoordinator = {
      id: assignment.coordinatorId,
      email: assignment.coordinatorEmail,
    };
  }

  const lead = buildManualLeadRecord({
    leadId,
    payload,
    coordinator: assignedCoordinator,
  });
  const saved = await saveLeadProfile(lead);

  const channelLabel =
    payload.channel.charAt(0).toUpperCase() + payload.channel.slice(1).replace(/_/g, " ");
  const noteLines = [
    `Lead manually entered by ${coordinator.email ?? "coordinator"}.`,
    `Channel: ${channelLabel}.`,
  ];
  if (payload.notes) {
    noteLines.push(`Notes: ${payload.notes}`);
  }

  try {
    await addCoordinatorNote(leadId, coordinator, {
      body: noteLines.join(" "),
      type: "general",
    });
  } catch (error) {
    console.error("[leads] manual lead entry note failed:", error);
  }

  void notifyLeadPipelineEvent({
    previous: null,
    current: saved,
  }).catch((error) => {
    console.error("[leads] Slack notification failed:", error);
  });

  return saved;
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

/** Merge stored leads with member intakes that may not have a lead snapshot yet. */
export const listCrmLeads = async (): Promise<LeadRecord[]> => {
  const [leads, { profiles }] = await Promise.all([
    listAllLeads(),
    listAllIntakes(),
  ]);

  const byId = new Map(leads.map((lead) => [lead.leadId, lead]));

  for (const profile of profiles) {
    if (!byId.has(profile.userId)) {
      byId.set(
        profile.userId,
        buildLeadFromSources({ userId: profile.userId, intake: profile })
      );
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const getLeadById = async (leadId: string): Promise<LeadRecord | null> =>
  getLeadsStorageMode() === "local"
    ? getLatestLocalLeadProfile(leadId)
    : getLatestS3LeadProfile(leadId);

/** Resolve a stored lead or build one from intake when the CRM list merged in a member profile. */
const materializeLead = async (leadId: string): Promise<LeadRecord | null> => {
  const existing = await getLeadById(leadId);
  if (existing) return existing;

  const { profiles } = await listAllIntakes();
  const profile = profiles.find((item) => item.userId === leadId);
  if (profile) {
    return buildLeadFromSources({ userId: leadId, intake: profile });
  }

  return null;
};

const ensureLeadRecord = async (leadId: string): Promise<LeadRecord> => {
  const lead = await materializeLead(leadId);
  if (!lead) throw new Error("Lead not found");
  return lead;
};

export const archiveLead = async (leadId: string): Promise<LeadRecord> => {
  const existing = await ensureLeadRecord(leadId);

  const updated: LeadRecord = {
    ...existing,
    archivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveLeadProfile(updated);
};

export const restoreLead = async (leadId: string): Promise<LeadRecord> => {
  const existing = await ensureLeadRecord(leadId);

  const updated: LeadRecord = {
    ...existing,
    archivedAt: null,
    updatedAt: new Date().toISOString(),
  };

  return saveLeadProfile(updated);
};

const loadConversationForLead = async (lead: LeadRecord) => {
  if (lead.conversationSessionId) {
    const session = await getConversationSession(
      lead.userId,
      lead.conversationSessionId,
      lead.email
    );
    if (session) return session;
  }
  return getLatestConversationForUser(lead.userId, lead.email);
};

export const getLeadDetail = async (
  leadId: string
): Promise<LeadDetailResponse | null> => {
  const lead = await materializeLead(leadId);
  if (!lead) return null;
  const notes =
    getLeadsStorageMode() === "local"
      ? await listLocalNotesForLead(leadId)
      : await listS3NotesForLead(leadId);

  let conversationPrep: LeadConversationPrep | null = null;
  let intakeProfile = null;
  let recommendations: LeadDetailResponse["recommendations"] = [];

  try {
    const session = await loadConversationForLead(lead);
    conversationPrep = buildCoordinatorPrepFromSession(lead, session);
  } catch (error) {
    console.error("[leads] conversation prep failed:", error);
  }

  if (!lead.isGuest) {
    try {
      const intake = await getIntakeForUser(lead.userId, lead.email);
      intakeProfile = intake.profile;
      recommendations = intake.recommendations;
    } catch (error) {
      console.error("[leads] intake profile load failed:", error);
    }
  }

  return { lead, notes, conversationPrep, intakeProfile, recommendations };
};

export const addCoordinatorNote = async (
  leadId: string,
  author: { id: string; email?: string },
  input: CreateCoordinatorNoteInput
): Promise<CoordinatorNote> => {
  await ensureLeadRecord(leadId);

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
  const existing = await ensureLeadRecord(leadId);

  if (input.status && !canAdminOverrideLeadStatus(existing.status, input.status, {
    isGuest: existing.isGuest,
  })) {
    throw new Error(`Cannot transition from ${existing.status} to ${input.status}`);
  }

  const updated: LeadRecord = {
    ...existing,
    status: input.status ?? existing.status,
    coordinatorId: input.coordinatorId !== undefined
      ? input.coordinatorId
      : existing.coordinatorId,
    coordinatorEmail: input.coordinatorEmail !== undefined
      ? input.coordinatorEmail
      : existing.coordinatorEmail,
    archivedAt:
      input.archivedAt !== undefined ? input.archivedAt : existing.archivedAt,
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveLeadProfile(updated);

  void notifyLeadPipelineEvent({
    previous: existing,
    current: saved,
  }).catch((error) => {
    console.error("[leads] Slack status notification failed:", error);
  });

  return saved;
};

export const assignLeadToCoordinator = async (
  leadId: string,
  coordinatorId: string
): Promise<LeadRecord> => {
  const assignment = await resolveCoordinatorAssignment(coordinatorId);
  return updateLead(leadId, assignment);
};

export const updateLeadStatus = async (
  leadId: string,
  status: LeadStatus
): Promise<LeadRecord> => updateLead(leadId, { status });
