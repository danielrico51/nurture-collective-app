import type { ClientServiceWithInvoices } from "@/types/clientService";
import type { PurchaseOrder } from "@/types/billing";
import type { LeadRecord } from "@/types/lead";
import type { ProposalMetadata } from "@/types/proposal";

/** Lifecycle of a managed client (distinct from the lead pipeline). */
export type ClientStatus =
  | "prospect"
  | "onboarding"
  | "active"
  | "inactive"
  | "archived";

export const CLIENT_STATUSES: ClientStatus[] = [
  "prospect",
  "onboarding",
  "active",
  "inactive",
  "archived",
];

export type ClientNoteType =
  | "general"
  | "call_log"
  | "billing"
  | "communication"
  | "follow_up";

/** Lightweight billing rollup kept on the client record for quick display. */
export interface ClientBillingSummary {
  lifetimeValueCents: number;
  openInvoiceCount: number;
  lastInvoiceAt: string | null;
}

/**
 * First-class client record. `clientId` is a stable UUID independent of the
 * lead pipeline or Cognito. Links to a lead and/or an app user are optional.
 */
export interface ClientRecord {
  clientId: string;
  status: ClientStatus;
  name: string;
  email: string;
  phone: string;
  /** Linked lead in the Lead CRM (when the client originated from / matches a lead). */
  leadId: string | null;
  /** Linked Cognito user sub (when the client also has an app account). */
  cognitoSub: string | null;
  /** How the client record was created: manual_<channel> | lead_conversion | proposal_signed. */
  source: string;
  coordinatorId: string;
  coordinatorEmail: string;
  tags: string[];
  locationZip: string | null;
  notesSummary: string;
  billing: ClientBillingSummary;
  /** When set, client is hidden from the default CRM queue. */
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  authorId: string;
  authorEmail: string;
  body: string;
  type: ClientNoteType;
  createdAt: string;
  storageKey?: string;
}

export type ClientCommunicationChannel = "email" | "sms" | "note" | "system";
export type ClientCommunicationDirection = "outbound" | "inbound";
export type ClientCommunicationStatus = "sent" | "failed" | "logged";

export interface ClientCommunication {
  id: string;
  clientId: string;
  channel: ClientCommunicationChannel;
  direction: ClientCommunicationDirection;
  subject: string;
  body: string;
  to: string;
  from: string;
  status: ClientCommunicationStatus;
  error: string | null;
  templateId: string | null;
  sentBy: string;
  sentByEmail: string;
  createdAt: string;
  storageKey?: string;
}

export interface ClientDetailResponse {
  client: ClientRecord;
  notes: ClientNote[];
  /** Linked lead snapshot when `client.leadId` resolves. */
  lead: LeadRecord | null;
  /** Proposals attached to this client (populated once proposals are re-keyed). */
  proposals: ProposalMetadata[];
  /** Billing orders for this client (legacy one-offs). */
  orders: PurchaseOrder[];
  /** Client services with nested invoices. */
  services: ClientServiceWithInvoices[];
  /** Communication log entries (email/sms/notes). */
  communications: ClientCommunication[];
}

export interface AdminClientsResponse {
  clients: ClientRecord[];
  storage?: ClientsCrmStorageScope;
}

/** Shared deployment scope for Client CRM, providers, and service schedule data. */
export interface ClientsCrmStorageScope {
  deploymentEnvironment: string;
  scope: string;
}

/** How a client first reached us when entered manually (mirrors lead channels). */
export type ManualClientChannel =
  | "phone"
  | "referral"
  | "email"
  | "event"
  | "social"
  | "provider_referral"
  | "walk_in"
  | "other";

export const MANUAL_CLIENT_CHANNELS: {
  value: ManualClientChannel;
  label: string;
}[] = [
  { value: "phone", label: "Phone call" },
  { value: "referral", label: "Referral" },
  { value: "email", label: "Email inquiry" },
  { value: "event", label: "Event / fair" },
  { value: "social", label: "Social media" },
  { value: "provider_referral", label: "Provider referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "other", label: "Other" },
];

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  channel: ManualClientChannel;
  leadId?: string | null;
  cognitoSub?: string | null;
  locationZip?: string | null;
  tags?: string[];
  notes?: string;
  coordinatorId?: string;
}

export interface UpdateClientInput {
  status?: ClientStatus;
  name?: string;
  email?: string;
  phone?: string;
  coordinatorId?: string;
  coordinatorEmail?: string;
  locationZip?: string | null;
  tags?: string[];
  notesSummary?: string;
  archivedAt?: string | null;
}

/** Link or unlink a lead and/or Cognito user. Pass null to unlink. */
export interface LinkClientInput {
  leadId?: string | null;
  cognitoSub?: string | null;
}

export interface CreateClientNoteInput {
  body: string;
  type?: ClientNoteType;
}

export interface ConvertLeadToClientInput {
  leadId: string;
  coordinatorId?: string;
}

export const EMPTY_CLIENT_BILLING_SUMMARY: ClientBillingSummary = {
  lifetimeValueCents: 0,
  openInvoiceCount: 0,
  lastInvoiceAt: null,
};
