import {
  CORPORATE_BENEFIT_PLATFORM_OPTIONS,
  EXPECTED_BABY_GENDER_OPTIONS,
  type CorporateBenefitPlatform,
  type ExpectedBabyGender,
  type LeadRecord,
} from "@/types/lead";
import type { IntakeProfile } from "@/types/intake";

export interface LeadSnapshotDisplay {
  clientName: string;
  partnerName: string | null;
  phone: string | null;
  email: string | null;
  dueDate: string | null;
  expectedBabyGender: ExpectedBabyGender | null;
  hospitalName: string | null;
  location: string | null;
  feeQuotedCents: number | null;
  feeQuotedMaxCents: number | null;
  feeQuotedNotes: string | null;
  corporateBenefitPlatform: CorporateBenefitPlatform | null;
  corporateBenefitNotes: string | null;
  corporateBenefitLabel: string | null;
  /** True when a field is filled from intake/member data rather than lead snapshot */
  dueDateFromIntake: boolean;
  locationFromIntake: boolean;
}

const genderLabel = (value: ExpectedBabyGender | null): string | null => {
  if (!value) return null;
  return (
    EXPECTED_BABY_GENDER_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
};

export const formatLeadSnapshotGender = genderLabel;

export const formatLeadSnapshotDueDate = (value: string | null): string | null => {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (cents: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export const formatLeadSnapshotFee = (
  cents: number | null,
  notes: string | null,
  maxCents: number | null = null
): string | null => {
  const min = cents != null && cents > 0 ? cents : null;
  const max = maxCents != null && maxCents > 0 ? maxCents : null;

  let amountLabel: string | null = null;
  if (min != null && max != null && max > min) {
    amountLabel = `${formatCurrency(min)} – ${formatCurrency(max)}`;
  } else if (min != null) {
    amountLabel = formatCurrency(min);
  } else if (max != null) {
    amountLabel = formatCurrency(max);
  }

  const trimmedNotes = notes?.trim();
  if (!amountLabel) {
    return trimmedNotes || null;
  }
  return trimmedNotes ? `${amountLabel} — ${trimmedNotes}` : amountLabel;
};

export const formatLeadCorporateBenefit = (
  platform: CorporateBenefitPlatform | null,
  notes: string | null
): string | null => {
  if (!platform) return null;
  if (platform === "other") {
    return notes?.trim() ? `Other (${notes.trim()})` : "Other platform";
  }
  return (
    CORPORATE_BENEFIT_PLATFORM_OPTIONS.find((option) => option.value === platform)
      ?.label ?? platform
  );
};

export const resolveLeadSnapshotDisplay = (
  lead: LeadRecord,
  intake?: IntakeProfile | null
): LeadSnapshotDisplay => {
  const dueDateFromIntake = !lead.dueDate && Boolean(intake?.dueDate);
  const locationFromIntake =
    !lead.locationAddress &&
    !lead.locationZip &&
    Boolean(intake?.locationZip?.trim());

  const locationParts = [
    lead.locationAddress?.trim() || null,
    lead.locationZip?.trim() || intake?.locationZip?.trim() || null,
  ].filter(Boolean);

  return {
    clientName: lead.name.trim() || intake?.name?.trim() || "",
    partnerName: lead.partnerName?.trim() || null,
    phone: lead.phone.trim() || intake?.phone?.trim() || null,
    email: lead.email.trim() || intake?.email?.trim() || null,
    dueDate: lead.dueDate ?? intake?.dueDate ?? null,
    expectedBabyGender: lead.expectedBabyGender,
    hospitalName: lead.hospitalName?.trim() || null,
    location: locationParts.length ? locationParts.join(" · ") : null,
    feeQuotedCents: lead.feeQuotedCents,
    feeQuotedMaxCents: lead.feeQuotedMaxCents,
    feeQuotedNotes: lead.feeQuotedNotes?.trim() || null,
    corporateBenefitPlatform: lead.corporateBenefitPlatform,
    corporateBenefitNotes: lead.corporateBenefitNotes?.trim() || null,
    corporateBenefitLabel: formatLeadCorporateBenefit(
      lead.corporateBenefitPlatform,
      lead.corporateBenefitNotes
    ),
    dueDateFromIntake,
    locationFromIntake,
  };
};

export const buildClientNotesSummaryFromLead = (lead: LeadRecord): string => {
  const snapshot = resolveLeadSnapshotDisplay(lead);
  const lines: string[] = [];

  if (lead.challengesSummary.trim()) {
    lines.push(lead.challengesSummary.trim());
  }

  const feeLine = formatLeadSnapshotFee(
    snapshot.feeQuotedCents,
    snapshot.feeQuotedNotes,
    snapshot.feeQuotedMaxCents
  );

  const snapshotLines = [
    snapshot.partnerName ? `Partner: ${snapshot.partnerName}` : null,
    snapshot.dueDate
      ? `Due date: ${formatLeadSnapshotDueDate(snapshot.dueDate)}`
      : null,
    snapshot.expectedBabyGender
      ? `Baby: ${genderLabel(snapshot.expectedBabyGender)}`
      : null,
    snapshot.hospitalName ? `Hospital: ${snapshot.hospitalName}` : null,
    snapshot.location ? `Location: ${snapshot.location}` : null,
    feeLine ? `Fee quoted: ${feeLine}` : null,
    snapshot.corporateBenefitLabel
      ? `Corporate benefits: ${snapshot.corporateBenefitLabel}`
      : null,
  ].filter(Boolean) as string[];

  if (snapshotLines.length) {
    lines.push(snapshotLines.join("\n"));
  }

  return lines.join("\n\n").trim();
};
