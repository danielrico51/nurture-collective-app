import type { LeadRecord } from "@/types/lead";

/** Default coordinator snapshot fields for new or legacy lead records. */
export const LEAD_SNAPSHOT_DEFAULTS: Pick<
  LeadRecord,
  | "partnerName"
  | "dueDate"
  | "expectedBabyGender"
  | "hospitalName"
  | "locationAddress"
  | "feeQuotedCents"
  | "feeQuotedNotes"
> = {
  partnerName: null,
  dueDate: null,
  expectedBabyGender: null,
  hospitalName: null,
  locationAddress: null,
  feeQuotedCents: null,
  feeQuotedNotes: null,
};

export const withLeadSnapshotDefaults = (lead: LeadRecord): LeadRecord => ({
  ...LEAD_SNAPSHOT_DEFAULTS,
  ...lead,
});
