import type { ClientsCrmStorageScope } from "@/types/client";
import type { ClientServiceWithInvoices } from "@/types/clientService";

export type EngagementServiceType = "postpartum" | "birth" | "other";

export const ENGAGEMENT_SERVICE_TYPES: EngagementServiceType[] = [
  "postpartum",
  "birth",
  "other",
];

export type EngagementStatus =
  | "booked"
  | "active"
  | "completed"
  | "cancelled";

export const ENGAGEMENT_STATUSES: EngagementStatus[] = [
  "booked",
  "active",
  "completed",
  "cancelled",
];

export type PaymentExpectationKind =
  | "deposit"
  | "balance"
  | "installment"
  | "adjustment"
  | "refund";

export const PAYMENT_EXPECTATION_KINDS: PaymentExpectationKind[] = [
  "deposit",
  "balance",
  "installment",
  "adjustment",
  "refund",
];

/** One spreadsheet client block — may contain multiple packages. */
export interface ServiceEngagement {
  engagementId: string;
  clientId: string;
  /** Billing anchor in Client CRM services. */
  serviceId: string;
  serviceType: EngagementServiceType;
  scheduleYear: number;
  primaryProviderId: string | null;
  bookDate: string;
  estimatedDate: string | null;
  estimatedNotes: string;
  status: EngagementStatus;
  importSource?: { file: string; rowStart: number };
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

/** A package row within an engagement (primary, add-on, or adjustment). */
export interface EngagementPackage {
  packageId: string;
  engagementId: string;
  sortOrder: number;
  label: string;
  clientFeeCents: number;
  hoursTotal: number | null;
  hoursAnnotation: string;
  schedulePattern: string;
  doulaFeeCents: number | null;
  providerId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

/** Client-side payment schedule row (deposit / balance / installment). */
export interface ClientPaymentExpectation {
  expectationId: string;
  engagementId: string;
  packageId: string;
  kind: PaymentExpectationKind;
  amountCents: number;
  dueDate: string | null;
  dueLabel: string;
  paidAt: string | null;
  invoiceId: string | null;
  coverageProviderId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export type ShiftType = "day" | "night" | "unknown";

export const SHIFT_TYPES: ShiftType[] = ["day", "night", "unknown"];

export type ShiftStatus = "scheduled" | "completed" | "cancelled";

export const SHIFT_STATUSES: ShiftStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
];

/** Atomic visit date for an engagement (spreadsheet column N expanded). */
export interface ScheduleShift {
  shiftId: string;
  engagementId: string;
  packageId: string | null;
  providerId: string;
  shiftDate: string;
  hours: number | null;
  shiftType: ShiftType;
  status: ShiftStatus;
  payoutBatchId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export type PayoutBatchStatus = "pending" | "paid";

export const PAYOUT_BATCH_STATUSES: PayoutBatchStatus[] = ["pending", "paid"];

/** Provider payout run (spreadsheet columns M–Q). */
export interface ProviderPayoutBatch {
  payoutBatchId: string;
  engagementId: string;
  packageId: string | null;
  providerId: string;
  doulaFeeCents: number | null;
  amountCents: number;
  hours: number | null;
  visitDatesLabel: string;
  shiftIds: string[];
  paidAt: string | null;
  status: PayoutBatchStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export interface ScheduleShiftWithProvider extends ScheduleShift {
  providerName: string | null;
}

export interface ProviderPayoutBatchWithProvider extends ProviderPayoutBatch {
  providerName: string | null;
}

export interface ServiceEngagementWithDetails extends ServiceEngagement {
  packages: EngagementPackage[];
  expectations: ClientPaymentExpectation[];
  shifts: ScheduleShiftWithProvider[];
  payouts: ProviderPayoutBatchWithProvider[];
  primaryProviderName: string | null;
  service: ClientServiceWithInvoices | null;
  totalClientFeeCents: number;
}

export interface CreateEngagementPackageInput {
  label?: string;
  clientFeeCents: number;
  hoursTotal?: number | null;
  hoursAnnotation?: string;
  schedulePattern?: string;
  doulaFeeCents?: number | null;
  providerId?: string | null;
  notes?: string;
}

export interface CreatePaymentExpectationInput {
  kind: PaymentExpectationKind;
  amountCents: number;
  dueDate?: string | null;
  dueLabel?: string;
  paidAt?: string | null;
  coverageProviderId?: string | null;
  notes?: string;
}

export interface CreateServiceEngagementInput {
  serviceType?: EngagementServiceType;
  scheduleYear?: number;
  primaryProviderId?: string | null;
  bookDate: string;
  estimatedDate?: string | null;
  estimatedNotes?: string;
  status?: EngagementStatus;
  package: CreateEngagementPackageInput;
  deposit?: CreatePaymentExpectationInput;
  balance?: CreatePaymentExpectationInput;
  /** Title for auto-created ClientService. Defaults from service type + year. */
  serviceTitle?: string;
  /** Link an existing service instead of creating one. */
  linkExistingServiceId?: string | null;
}

export interface UpdateServiceEngagementInput {
  serviceType?: EngagementServiceType;
  scheduleYear?: number;
  primaryProviderId?: string | null;
  bookDate?: string;
  estimatedDate?: string | null;
  estimatedNotes?: string;
  status?: EngagementStatus;
}

export interface UpdateEngagementPackageInput {
  label?: string;
  clientFeeCents?: number;
  hoursTotal?: number | null;
  hoursAnnotation?: string;
  schedulePattern?: string;
  doulaFeeCents?: number | null;
  providerId?: string | null;
  notes?: string;
}

export interface UpdatePaymentExpectationInput {
  kind?: PaymentExpectationKind;
  amountCents?: number;
  dueDate?: string | null;
  dueLabel?: string;
  paidAt?: string | null;
  invoiceId?: string | null;
  coverageProviderId?: string | null;
  notes?: string;
}

export interface CreateScheduleShiftInput {
  providerId: string;
  shiftDate: string;
  packageId?: string | null;
  hours?: number | null;
  shiftType?: ShiftType;
  status?: ShiftStatus;
  notes?: string;
}

/** Bulk-create shifts from a spreadsheet-style dates label, e.g. `1/17,19,24`. */
export interface CreateScheduleShiftsFromLabelInput {
  visitDatesLabel: string;
  providerId: string;
  packageId?: string | null;
  hoursPerShift?: number | null;
  shiftType?: ShiftType;
}

export interface UpdateScheduleShiftInput {
  providerId?: string;
  shiftDate?: string;
  packageId?: string | null;
  hours?: number | null;
  shiftType?: ShiftType;
  status?: ShiftStatus;
  payoutBatchId?: string | null;
  notes?: string;
}

export interface CreateProviderPayoutBatchInput {
  providerId: string;
  amountCents: number;
  packageId?: string | null;
  doulaFeeCents?: number | null;
  hours?: number | null;
  visitDatesLabel?: string;
  shiftIds?: string[];
  paidAt?: string | null;
  status?: PayoutBatchStatus;
  notes?: string;
}

export interface UpdateProviderPayoutBatchInput {
  providerId?: string;
  amountCents?: number;
  packageId?: string | null;
  doulaFeeCents?: number | null;
  hours?: number | null;
  visitDatesLabel?: string;
  shiftIds?: string[];
  paidAt?: string | null;
  status?: PayoutBatchStatus;
  markPaid?: boolean;
  notes?: string;
}

export interface ProviderPayoutReportRow extends ProviderPayoutBatchWithProvider {
  clientId: string;
  clientName: string;
  engagementId: string;
  scheduleYear: number;
  bookDate: string;
}

export interface ClientEngagementsResponse {
  engagements: ServiceEngagementWithDetails[];
  storage: ClientsCrmStorageScope;
}

export interface ProviderPayoutReportResponse {
  payouts: ProviderPayoutReportRow[];
  storage: ClientsCrmStorageScope;
}
