import { normalizePhone } from "@/lib/intake/submitService";
import type { ExpectedBabyGender, UpdateLeadInput } from "@/types/lead";
import { EXPECTED_BABY_GENDER_OPTIONS } from "@/types/lead";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_GENDERS = new Set<ExpectedBabyGender>(
  EXPECTED_BABY_GENDER_OPTIONS.map((option) => option.value)
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
  | "feeQuotedNotes"
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

const parseFeeQuotedCents = (body: Record<string, unknown>): number | null | undefined => {
  if (!("feeQuotedCents" in body) && !("feeQuotedAmount" in body)) {
    return undefined;
  }

  if ("feeQuotedCents" in body) {
    const raw = body.feeQuotedCents;
    if (raw == null || raw === "") return null;
    const cents = Math.round(Number(raw));
    if (!Number.isFinite(cents) || cents < 0) {
      throw new LeadSnapshotValidationError("Fee quoted must be a non-negative amount");
    }
    return cents;
  }

  const dollars = String(body.feeQuotedAmount ?? "").trim();
  if (!dollars) return null;
  const parsed = Number(dollars.replace(/[$,]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new LeadSnapshotValidationError("Fee quoted must be a valid dollar amount");
  }
  return Math.round(parsed * 100);
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

  const feeQuotedCents = parseFeeQuotedCents(body);
  if (feeQuotedCents !== undefined) {
    result.feeQuotedCents = feeQuotedCents;
  }

  if ("feeQuotedNotes" in body) {
    result.feeQuotedNotes = readNullableString(body, "feeQuotedNotes");
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
    "feeQuotedAmount",
    "feeQuotedNotes",
  ].some((key) => key in body);
