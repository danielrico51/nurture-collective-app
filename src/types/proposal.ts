export type ProposalStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "AWAITING_SIGNATURE"
  | "SIGNED"
  | "DECLINED"
  | "EXPIRED";

export type ProposalAuditEventType =
  | "proposal_created"
  | "proposal_generated"
  | "proposal_revision_requested"
  | "proposal_revised"
  | "proposal_approved"
  | "proposal_sent_for_signature"
  | "proposal_signed"
  | "proposal_declined"
  | "proposal_expired";

export interface ProposalMetadata {
  proposal_id: string;
  client_id: string;
  lead_id: string;
  status: ProposalStatus;
  google_doc_id: string | null;
  google_doc_url: string | null;
  signature_request_id: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  sent_at: string | null;
  signed_at: string | null;
  version: number;
  service_tags: string[];
}

export interface ProposalLlmContent {
  executive_summary: string;
  recommended_services: Array<{
    name: string;
    description: string;
    frequency?: string;
  }>;
  timeline: string;
  pricing: string;
  terms: string;
  next_steps: string;
}

export interface ProposalVersionRecord {
  version: number;
  created_at: string;
  created_by: string;
  revision_notes?: string;
  content: ProposalLlmContent;
}

export interface ProposalAuditEvent {
  event_id: string;
  event_type: ProposalAuditEventType;
  proposal_id: string;
  client_id: string;
  actor_id: string;
  actor_email: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface ProposalContextPackage {
  client_name: string;
  services_requested: string[];
  budget: string;
  family_size: string;
  call_summary: string;
  recommended_services: string[];
  pricing: Record<string, string>;
  notes: string;
  maternal_stage: string;
  support_interests: string[];
  location: string;
}

export interface ProposalLibraryEntry {
  id: string;
  service_type: string;
  title: string;
  tags: {
    service_types: string[];
    budget_range: string;
    family_size: string;
    goals: string[];
  };
  style_reference: {
    executive_summary: string;
    recommended_services: ProposalLlmContent["recommended_services"];
    timeline: string;
    pricing: string;
    next_steps: string;
  };
}

export interface SignatureWebhookPayload {
  event: "SIGNED" | "DECLINED" | "EXPIRED";
  signature_request_id: string;
  proposal_id?: string;
  client_id?: string;
}
