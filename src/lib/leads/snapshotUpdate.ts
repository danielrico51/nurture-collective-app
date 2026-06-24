import { normalizePhone } from "@/lib/intake/submitService";
import type { ExpectedBabyGender, UpdateLeadInput } from "@/types/lead";
import {
  CORPORATE_BENEFIT_PLATFORM_OPTIONS,
  EXPECTED_BABY_GENDER_OPTIONS,
  type CorporateBenefitPlatform,
} from "@/types/lead";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_GENDERS = new Set<ExpectedBabyGender>(
  EXPECTED_BABY_GENDER_OPTIONS.map((option) => option.value)
);

const VALID_CORPORATE_BENEFIT_PLATFORMS = new Set<CorporateBenefitPlatform>(
  CORPORATE_BENEFIT_PLATFORM_OPTIONS.map((option) => option.value)
);

export class LeadSnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadSnapshotValidationError";
  }
}

export type UpdateLeadSnapshotInput = Pick<
  UpdateLeadInput,
  | "name"
  | "email"
  | "phone"
  | "locationZip"
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
>;

const readOptionalString = (
  body: Record<string, unknown>,
  key: string
): string | undefined => {
  if (!(key in body)) return undefined;
  return String(body[key] ?? "").trim();
};

const readNullableString = (
  body: Record<string, unknown>,
  key: string
): string | null | undefined => {
  if (!(key in body)) return undefined;
  const value = String(body[key] ?? "").trim();
  return value || null;
};

const parseDollarAmountToCents = (
  raw: unknown,
  label: string
): number | null => {
  if (raw == null || raw === "") return null;
  const dollars = String(raw).trim();
  if (!dollars) return null;
  const parsed = Number(dollars.replace(/[$,]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new LeadSnapshotValidationError(`${label} must be a valid dollar amount`);
  }
  return Math.round(parsed * 100);
};

const parseFeeQuotedCentsField = (
  body: Record<string, unknown>,
  centsKey: "feeQuotedCents" | "feeQuotedMaxCents",
  amountKey: "feeQuotedAmount" | "feeQuotedMaxAmount",
  label: string
): number | null | undefined => {
  if (!(centsKey in body) && !(amountKey in body)) {
    return undefined;
  }

  if (centsKey in body) {
    const raw = body[centsKey];
    if (raw == null || raw === "") return null;
    const cents = Math.round(Number(raw));
    if (!Number.isFinite(cents) || cents < 0) {
      throw new LeadSnapshotValidationError(`${label} must be a non-negative amount`);
    }
    return cents;
  }

  return parseDollarAmountToCents(body[amountKey], label);
};

const parseFeeQuotedFields = (
  body: Record<string, unknown>
): Pick<UpdateLeadSnapshotInput, "feeQuotedCents" | "feeQuotedMaxCents"> => {
  const feeQuotedCents = parseFeeQuotedCentsField(
    body,
    "feeQuotedCents",
    "feeQuotedAmount",
    "Fee quoted (from)"
  );
  const feeQuotedMaxCents = parseFeeQuotedCentsField(
    body,
    "feeQuotedMaxCents",
    "feeQuotedMaxAmount",
    "Fee quoted (to)"
  );

  const result: Pick<UpdateLeadSnapshotInput, "feeQuotedCents" | "feeQuotedMaxCents"> =
    {};

  if (feeQuotedCents !== undefined) {
    result.feeQuotedCents = feeQuotedCents;
  }
  if (feeQuotedMaxCents !== undefined) {
    result.feeQuotedMaxCents = feeQuotedMaxCents;
  }

  const min = result.feeQuotedCents;
  const max = result.feeQuotedMaxCents;

  if (max != null && min == null) {
    throw new LeadSnapshotValidationError(
      "Fee quoted (from) is required when a maximum is set"
    );
  }

  if (min != null && max != null && max < min) {
    throw new LeadSnapshotValidationError(
      "Fee quoted (to) must be greater than or equal to fee quoted (from)"
    );
  }

  if (min != null && max != null && max === min) {
    result.feeQuotedMaxCents = null;
  }

  return result;
};

export const validateUpdateLeadSnapshotInput = (
  raw: unknown
): UpdateLeadSnapshotInput => {
  if (!raw || typeof raw !== "object") {
    throw new LeadSnapshotValidationError("Malformed payload");
  }

  const body = raw as Record<string, unknown>;
  const result: UpdateLeadSnapshotInput = {};

  if ("name" in body) {
    const name = String(body.name ?? "").trim();
    if (!name) {
      throw new LeadSnapshotValidationError("Client name is required");
    }
    result.name = name;
  }

  if ("email" in body) {
    const email = String(body.email ?? "").trim();
    if (email && !EMAIL_PATTERN.test(email)) {
      throw new LeadSnapshotValidationError("Invalid email address");
    }
    result.email = email;
  }

  if ("phone" in body) {
    result.phone = normalizePhone(String(body.phone ?? "").trim());
  }

  if ("locationZip" in body) {
    result.locationZip = readNullableString(body, "locationZip");
  }

  if ("partnerName" in body) {
    result.partnerName = readNullableString(body, "partnerName");
  }

  if ("dueDate" in body) {
    const dueDate = readNullableString(body, "dueDate");
    if (dueDate && !ISO_DATE_PATTERN.test(dueDate)) {
      throw new LeadSnapshotValidationError("Due date must be YYYY-MM-DD");
    }
    result.dueDate = dueDate;
  }

  if ("expectedBabyGender" in body) {
    const rawGender = readNullableString(body, "expectedBabyGender");
    if (rawGender && !VALID_GENDERS.has(rawGender as ExpectedBabyGender)) {
      throw new LeadSnapshotValidationError("Invalid baby gender option");
    }
    result.expectedBabyGender = rawGender as ExpectedBabyGender | null;
  }

  if ("hospitalName" in body) {
    result.hospitalName = readNullableString(body, "hospitalName");
  }

  if ("locationAddress" in body) {
    result.locationAddress = readNullableString(body, "locationAddress");
  }

  Object.assign(result, parseFeeQuotedFields(body));

  if ("feeQuotedNotes" in body) {
    result.feeQuotedNotes = readNullableString(body, "feeQuotedNotes");
  }

  if ("corporateBenefitPlatform" in body) {
    const rawPlatform = readNullableString(body, "corporateBenefitPlatform");
    if (
      rawPlatform &&
      !VALID_CORPORATE_BENEFIT_PLATFORMS.has(rawPlatform as CorporateBenefitPlatform)
    ) {
      throw new LeadSnapshotValidationError("Invalid corporate benefits platform");
    }
    result.corporateBenefitPlatform = rawPlatform as CorporateBenefitPlatform | null;
    if (!rawPlatform) {
      result.corporateBenefitNotes = null;
    }
  }

  if ("corporateBenefitNotes" in body) {
    result.corporateBenefitNotes = readNullableString(body, "corporateBenefitNotes");
  }

  const nextPlatform =
    result.corporateBenefitPlatform ??
    (body.corporateBenefitPlatform
      ? (String(body.corporateBenefitPlatform).trim() as CorporateBenefitPlatform)
      : null);

  if (nextPlatform === "other") {
    const notes =
      result.corporateBenefitNotes ??
      (body.corporateBenefitNotes ? String(body.corporateBenefitNotes).trim() : "");
    if (!notes) {
      throw new LeadSnapshotValidationError(
        "Platform name is required when Other is selected"
      );
    }
  }

  if (
    result.corporateBenefitPlatform !== undefined &&
    result.corporateBenefitPlatform !== null &&
    result.corporateBenefitPlatform !== "other"
  ) {
    result.corporateBenefitNotes = null;
  }

  const hasContactField =
    result.name !== undefined ||
    result.email !== undefined ||
    result.phone !== undefined;

  if (hasContactField) {
    const nextName = result.name ?? String(body.name ?? "").trim();
    const nextEmail =
      result.email !== undefined ? result.email : String(body.email ?? "").trim();
    const nextPhone =
      result.phone !== undefined
        ? result.phone
        : normalizePhone(String(body.phone ?? "").trim());
    if (!nextName) {
      throw new LeadSnapshotValidationError("Client name is required");
    }
    if (!nextPhone && !nextEmail) {
      throw new LeadSnapshotValidationError("Phone or email is required");
    }
  }

  if (Object.keys(result).length === 0) {
    throw new LeadSnapshotValidationError("No snapshot fields to update");
  }

  return result;
};

export const hasLeadSnapshotFields = (body: Record<string, unknown>): boolean =>
  [
    "name",
    "email",
    "phone",
    "locationZip",
    "partnerName",
    "dueDate",
    "expectedBabyGender",
    "hospitalName",
    "locationAddress",
    "feeQuotedCents",
    "feeQuotedMaxCents",
    "feeQuotedAmount",
    "feeQuotedMaxAmount",
    "feeQuotedNotes",
    "corporateBenefitPlatform",
    "corporateBenefitNotes",
  ].some((key) => key in body);
