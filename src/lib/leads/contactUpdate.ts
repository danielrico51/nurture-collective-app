import { normalizePhone } from "@/lib/intake/submitService";
import type { UpdateLeadInput } from "@/types/lead";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LeadContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadContactValidationError";
  }
}

export type UpdateLeadContactInput = Pick<
  UpdateLeadInput,
  | "name"
  | "email"
  | "phone"
  | "locationZip"
  | "maternalStage"
  | "supportInterests"
  | "challengesSummary"
>;

export const validateUpdateLeadContactInput = (
  raw: unknown
): UpdateLeadContactInput => {
  if (!raw || typeof raw !== "object") {
    throw new LeadContactValidationError("Malformed payload");
  }

  const body = raw as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = normalizePhone(String(body.phone ?? "").trim());
  const maternalStage = body.maternalStage
    ? String(body.maternalStage).trim()
    : null;
  const locationZip = body.locationZip ? String(body.locationZip).trim() : null;
  const challengesSummary = String(body.challengesSummary ?? "").trim();

  if (!name) {
    throw new LeadContactValidationError("Name is required");
  }
  if (!phone && !email) {
    throw new LeadContactValidationError("Phone or email is required");
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new LeadContactValidationError("Invalid email address");
  }

  const supportInterests = Array.isArray(body.supportInterests)
    ? body.supportInterests.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    name,
    email,
    phone,
    maternalStage: maternalStage || null,
    locationZip: locationZip || null,
    supportInterests,
    challengesSummary,
  };
};
