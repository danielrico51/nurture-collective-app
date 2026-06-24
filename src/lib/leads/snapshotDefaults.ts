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
  | "feeQuotedMaxCents"
  | "feeQuotedNotes"
  | "corporateBenefitPlatform"
  | "corporateBenefitNotes"
> = {
  partnerName: null,
  dueDate: null,
  expectedBabyGender: null,
  hospitalName: null,
  locationAddress: null,
  feeQuotedCents: null,
  feeQuotedMaxCents: null,
  feeQuotedNotes: null,
  corporateBenefitPlatform: null,
  corporateBenefitNotes: null,
};

export const withLeadSnapshotDefaults = (lead: LeadRecord): LeadRecord => ({
  ...LEAD_SNAPSHOT_DEFAULTS,
  ...lead,
});
