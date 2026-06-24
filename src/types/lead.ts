import type { CareRecommendation, IntakeProfile } from "@/types/intake";

export type LeadStatus =
  | "new"
  | "intake_in_progress"
  | "intake_completed"
  | "consult_scheduled"
  | "consult_completed"
  | "send_to_doula"
  | "proposal_sent"
  | "qualified"
  | "lost"
  | "stale"
  /** @deprecated Prefer converted_to_member or under_contract */
  | "converted"
  | "converted_to_member"
  | "under_contract";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "intake_in_progress",
  "intake_completed",
  "consult_scheduled",
  "consult_completed",
  "send_to_doula",
  "proposal_sent",
  "qualified",
  "lost",
  "stale",
  "converted",
  "converted_to_member",
  "under_contract",
];

export type CoordinatorNoteType =
  | "general"
  | "call_log"
  | "prep"
  | "follow_up";

export type ExpectedBabyGender =
  | "girl"
  | "boy"
  | "twins"
  | "unknown"
  | "surprise";

export const EXPECTED_BABY_GENDER_OPTIONS: {
  value: ExpectedBabyGender;
  label: string;
}[] = [
  { value: "girl", label: "Girl" },
  { value: "boy", label: "Boy" },
  { value: "twins", label: "Twins" },
  { value: "unknown", label: "Unknown" },
  { value: "surprise", label: "Surprise" },
];

export type CorporateBenefitPlatform =
  | "carrot"
  | "maven"
  | "progenyhealth"
  | "other"
  | "unknown";

export const CORPORATE_BENEFIT_PLATFORM_OPTIONS: {
  value: CorporateBenefitPlatform;
  label: string;
}[] = [
  { value: "carrot", label: "Carrot" },
  { value: "maven", label: "Maven Clinic" },
  { value: "progenyhealth", label: "ProgenyHealth" },
  { value: "other", label: "Other platform" },
  { value: "unknown", label: "Unknown / not sure" },
];

export interface LeadRecord {
  leadId: string;
  userId: string;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string;
  maternalStage: string | null;
  source: string;
  isGuest: boolean;
  coordinatorId: string;
  coordinatorEmail: string;
  intakeStatus: string | null;
  completionScore: number;
  supportInterests: string[];
  challengesSummary: string;
  /** US ZIP from intake / concierge (used for coverage + expansion alerts) */
  locationZip: string | null;
  /** Coordinator snapshot — partner / birth plan context */
  partnerName: string | null;
  /** Expected due date (ISO YYYY-MM-DD) */
  dueDate: string | null;
  expectedBabyGender: ExpectedBabyGender | null;
  hospitalName: string | null;
  /** Street / city — ZIP may also be in locationZip */
  locationAddress: string | null;
  feeQuotedCents: number | null;
  feeQuotedMaxCents: number | null;
  feeQuotedNotes: string | null;
  /** Employer-sponsored benefits platform, if applicable */
  corporateBenefitPlatform: CorporateBenefitPlatform | null;
  /** Custom platform name when corporateBenefitPlatform is other */
  corporateBenefitNotes: string | null;
  /** When set, lead is hidden from the default CRM queue */
  archivedAt: string | null;
  conversationSessionId: string | null;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export interface CoordinatorNote {
  id: string;
  leadId: string;
  authorId: string;
  authorEmail: string;
  body: string;
  type: CoordinatorNoteType;
  createdAt: string;
  storageKey?: string;
}

export interface LeadConversationPrep {
  sessionId: string | null;
  sessionStatus: string | null;
  messageCount: number;
  updatedAt: string | null;
  narrativeSummary: string;
  summaryBullets: string[];
  emotionalState: string | null;
  recentMessages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
}

export interface LeadDetailResponse {
  lead: LeadRecord;
  notes: CoordinatorNote[];
  conversationPrep: LeadConversationPrep | null;
  /** Full member intake profile when the person created an account */
  intakeProfile: IntakeProfile | null;
  recommendations: CareRecommendation[];
}

export interface AdminLeadsResponse {
  leads: LeadRecord[];
}

export interface CreateCoordinatorNoteInput {
  body: string;
  type?: CoordinatorNoteType;
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  name?: string;
  email?: string;
  phone?: string;
  locationZip?: string | null;
  maternalStage?: string | null;
  supportInterests?: string[];
  challengesSummary?: string;
  coordinatorId?: string;
  coordinatorEmail?: string;
  archivedAt?: string | null;
  partnerName?: string | null;
  dueDate?: string | null;
  expectedBabyGender?: ExpectedBabyGender | null;
  hospitalName?: string | null;
  locationAddress?: string | null;
  feeQuotedCents?: number | null;
  feeQuotedMaxCents?: number | null;
  feeQuotedNotes?: string | null;
  corporateBenefitPlatform?: CorporateBenefitPlatform | null;
  corporateBenefitNotes?: string | null;
}

/** Assign or clear coordinator using admin user id (empty string = unassigned). */
export interface AssignLeadCoordinatorInput {
  coordinatorId: string;
}

/** How a coordinator-entered lead first reached us (non-intake channels). */
export type ManualLeadChannel =
  | "phone"
  | "referral"
  | "email"
  | "event"
  | "social"
  | "provider_referral"
  | "other";

export const MANUAL_LEAD_CHANNELS: { value: ManualLeadChannel; label: string }[] = [
  { value: "phone", label: "Phone call" },
  { value: "referral", label: "Referral" },
  { value: "email", label: "Email inquiry" },
  { value: "event", label: "Event / fair" },
  { value: "social", label: "Social media" },
  { value: "provider_referral", label: "Provider referral" },
  { value: "other", label: "Other" },
];

export interface CreateManualLeadInput {
  name: string;
  email?: string;
  phone?: string;
  channel: ManualLeadChannel;
  maternalStage?: string | null;
  supportInterests?: string[];
  locationZip?: string | null;
  notes?: string;
  coordinatorId?: string;
}
