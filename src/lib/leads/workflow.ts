import type { IntakeProfile } from "@/types/intake";
import type { LeadRecord, LeadStatus } from "@/types/lead";
import type { ExtractedMaternalProfile } from "@/types/conversation";

const GUEST_PREFIX = "guest_";

export const resolveLeadId = (userId: string): string => userId.trim();

export const isGuestLead = (userId: string): boolean =>
  userId.startsWith(GUEST_PREFIX);

const PRESERVED_STATUSES: LeadStatus[] = [
  "converted",
  "converted_to_member",
  "under_contract",
  "lost",
];

const LOCKED_STATUSES: LeadStatus[] = ["converted", "converted_to_member", "lost"];

const isPreservedStatus = (status?: LeadStatus): boolean =>
  Boolean(status && PRESERVED_STATUSES.includes(status));

/** Map intake + conversation progress to CRM lead status. */
export const deriveLeadStatus = (input: {
  intakeStatus?: string | null;
  completionScore?: number;
  hasSubmittedIntake?: boolean;
  hasConsultScheduled?: boolean;
  currentStatus?: LeadStatus;
}): LeadStatus => {
  if (input.hasConsultScheduled) return "consult_scheduled";
  if (isPreservedStatus(input.currentStatus)) {
    return input.currentStatus!;
  }
  if (input.currentStatus === "consult_scheduled") return "consult_scheduled";
  if (input.currentStatus === "consult_completed") return "consult_completed";
  if (input.currentStatus === "send_to_doula") return "send_to_doula";
  if (input.currentStatus === "proposal_sent") return "proposal_sent";
  if (input.currentStatus === "qualified") return "qualified";
  if (input.currentStatus === "stale") return "stale";

  if (input.hasSubmittedIntake || input.intakeStatus === "submitted") {
    return "intake_completed";
  }
  if (input.intakeStatus === "in-review") {
    return "qualified";
  }
  if ((input.completionScore ?? 0) > 0) {
    return "intake_in_progress";
  }
  return "new";
};

export const buildLeadFromSources = (input: {
  userId: string;
  intake?: IntakeProfile | null;
  extracted?: ExtractedMaternalProfile | null;
  conversationSessionId?: string | null;
  existing?: Partial<LeadRecord> | null;
  hasSubmittedIntake?: boolean;
  hasConsultScheduled?: boolean;
}): LeadRecord => {
  const leadId = resolveLeadId(input.userId);
  const intake = input.intake;
  const extracted = input.extracted;
  const now = new Date().toISOString();

  const name = intake?.name || extracted?.name || input.existing?.name || "";
  const email = intake?.email || extracted?.email || input.existing?.email || "";
  const phone = intake?.phone || extracted?.phone || input.existing?.phone || "";
  const maternalStage =
    intake?.maternalStage || extracted?.maternalStage || input.existing?.maternalStage || null;
  const completionScore =
    extracted?.completionScore ?? input.existing?.completionScore ?? 0;
  const intakeStatus = intake?.intakeStatus ?? input.existing?.intakeStatus ?? null;

  const status = deriveLeadStatus({
    intakeStatus,
    completionScore,
    hasSubmittedIntake: input.hasSubmittedIntake,
    hasConsultScheduled: input.hasConsultScheduled,
    currentStatus: input.existing?.status,
  });

  const supportInterests =
    intake?.supportInterests?.length
      ? intake.supportInterests
      : extracted?.supportInterests?.length
        ? extracted.supportInterests
        : input.existing?.supportInterests ?? [];

  const challengesSummary =
    intake?.challengesFreeText ||
    extracted?.challengesFreeText ||
    input.existing?.challengesSummary ||
    "";

  const locationZip =
    intake?.locationZip ||
    extracted?.locationZip ||
    input.existing?.locationZip ||
    null;

  return {
    leadId,
    userId: input.userId,
    status,
    name,
    email,
    phone,
    maternalStage,
    source: isGuestLead(input.userId) ? "public_intake" : "member_intake",
    isGuest: isGuestLead(input.userId),
    coordinatorId: input.existing?.coordinatorId ?? "",
    coordinatorEmail: input.existing?.coordinatorEmail ?? "",
    intakeStatus,
    completionScore,
    supportInterests,
    challengesSummary,
    locationZip: locationZip?.trim() || null,
    partnerName: input.existing?.partnerName ?? null,
    dueDate:
      input.existing?.dueDate ??
      intake?.dueDate ??
      extracted?.dueDate ??
      null,
    expectedBabyGender: input.existing?.expectedBabyGender ?? null,
    hospitalName: input.existing?.hospitalName ?? null,
    locationAddress: input.existing?.locationAddress ?? null,
    feeQuotedCents: input.existing?.feeQuotedCents ?? null,
    feeQuotedNotes: input.existing?.feeQuotedNotes ?? null,
    corporateBenefitPlatform: input.existing?.corporateBenefitPlatform ?? null,
    corporateBenefitNotes: input.existing?.corporateBenefitNotes ?? null,
    archivedAt: input.existing?.archivedAt ?? null,
    conversationSessionId:
      input.conversationSessionId ?? input.existing?.conversationSessionId ?? null,
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
  };
};

export const canTransitionLeadStatus = (
  from: LeadStatus,
  to: LeadStatus
): boolean => {
  if (from === to) return true;
  if (LOCKED_STATUSES.includes(from)) return false;

  const allowed: Record<LeadStatus, LeadStatus[]> = {
    new: ["intake_in_progress", "lost", "stale"],
    intake_in_progress: ["intake_completed", "qualified", "lost", "stale"],
    intake_completed: ["consult_scheduled", "qualified", "lost", "stale"],
    consult_scheduled: ["consult_completed", "intake_completed", "lost", "stale"],
    consult_completed: ["send_to_doula", "qualified", "lost", "stale"],
    send_to_doula: ["proposal_sent", "qualified", "lost", "stale"],
    proposal_sent: [
      "qualified",
      "converted",
      "converted_to_member",
      "under_contract",
      "lost",
      "stale",
    ],
    qualified: [
      "consult_scheduled",
      "proposal_sent",
      "converted",
      "converted_to_member",
      "under_contract",
      "lost",
      "stale",
    ],
    lost: [],
    stale: ["intake_in_progress", "intake_completed", "qualified", "lost"],
    converted: [],
    converted_to_member: [],
    under_contract: ["lost", "stale"],
  };

  return allowed[from]?.includes(to) ?? false;
};

/** Statuses coordinators can set manually in the CRM (excludes deprecated `converted`). */
export const ADMIN_PIPELINE_STATUSES: LeadStatus[] = [
  "new",
  "intake_in_progress",
  "intake_completed",
  "consult_scheduled",
  "consult_completed",
  "send_to_doula",
  "proposal_sent",
  "qualified",
  "under_contract",
  "converted_to_member",
  "lost",
  "stale",
];

/**
 * Relaxed rules for coordinator manual updates in the CRM.
 * Allows skipping pipeline steps; only blocks deprecated/lead-type-specific targets.
 */
export const canAdminOverrideLeadStatus = (
  from: LeadStatus,
  to: LeadStatus,
  options?: { isGuest?: boolean }
): boolean => {
  if (from === to) return true;
  if (to === "converted") return false;
  if (!ADMIN_PIPELINE_STATUSES.includes(to)) return false;
  if (to === "converted_to_member" && options?.isGuest === false) return false;
  if (to === "under_contract" && options?.isGuest === true) return false;
  return true;
};

export const getAllowedLeadTransitions = (
  from: LeadStatus,
  options?: { isGuest?: boolean }
): LeadStatus[] =>
  ADMIN_PIPELINE_STATUSES.filter((status) => {
    if (status === from) return false;
    return canAdminOverrideLeadStatus(from, status, options);
  });
