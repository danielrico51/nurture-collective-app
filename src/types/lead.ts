export type LeadStatus =
  | "new"
  | "intake_in_progress"
  | "intake_completed"
  | "consult_scheduled"
  | "consult_completed"
  | "proposal_sent"
  | "qualified"
  | "lost"
  | "stale"
  | "converted";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "intake_in_progress",
  "intake_completed",
  "consult_scheduled",
  "consult_completed",
  "proposal_sent",
  "qualified",
  "lost",
  "stale",
  "converted",
];

export type CoordinatorNoteType =
  | "general"
  | "call_log"
  | "prep"
  | "follow_up";

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

export interface LeadDetailResponse {
  lead: LeadRecord;
  notes: CoordinatorNote[];
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
  coordinatorId?: string;
  coordinatorEmail?: string;
}
