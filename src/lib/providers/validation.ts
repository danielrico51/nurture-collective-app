import {
  PROVIDER_ROLES,
  PROVIDER_STATUSES,
  type CreateProviderInput,
  type ProviderRole,
  type ProviderStatus,
  type UpdateProviderInput,
} from "@/types/provider";

export class ProviderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderValidationError";
  }
}

const parseRoles = (value: unknown): ProviderRole[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return ["postpartum_doula"];
  }
  const roles = value.map((item) => String(item).trim()) as ProviderRole[];
  for (const role of roles) {
    if (!PROVIDER_ROLES.includes(role)) {
      throw new ProviderValidationError(`Invalid provider role: ${role}`);
    }
  }
  return roles;
};

const parseAliases = (value: unknown, displayName: string): string[] => {
  const aliases = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const normalized = new Set<string>();
  for (const alias of [displayName, ...aliases]) {
    const trimmed = alias.trim();
    if (trimmed) normalized.add(trimmed);
  }
  return Array.from(normalized);
};

const parseOptionalRate = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const cents = Number(value);
  if (!Number.isFinite(cents) || cents < 0) {
    throw new ProviderValidationError(
      "defaultHourlyRateCents must be a non-negative number"
    );
  }
  return Math.round(cents);
};

export const validateCreateProviderInput = (
  raw: unknown
): CreateProviderInput => {
  if (!raw || typeof raw !== "object") {
    throw new ProviderValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const displayName = String(body.displayName ?? "").trim();
  if (!displayName) {
    throw new ProviderValidationError("displayName is required");
  }

  const status = body.status
    ? (String(body.status) as ProviderStatus)
    : "active";
  if (!PROVIDER_STATUSES.includes(status)) {
    throw new ProviderValidationError("Invalid status");
  }

  return {
    displayName,
    aliases: parseAliases(body.aliases, displayName),
    roles: parseRoles(body.roles),
    email: String(body.email ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    defaultHourlyRateCents: parseOptionalRate(body.defaultHourlyRateCents),
    notes: String(body.notes ?? "").trim(),
    status,
  };
};

export const validateUpdateProviderInput = (
  raw: unknown
): UpdateProviderInput => {
  if (!raw || typeof raw !== "object") {
    throw new ProviderValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const updates: UpdateProviderInput = {};

  if (body.displayName !== undefined) {
    const displayName = String(body.displayName).trim();
    if (!displayName) {
      throw new ProviderValidationError("displayName cannot be empty");
    }
    updates.displayName = displayName;
  }
  if (body.aliases !== undefined) {
    updates.aliases = Array.isArray(body.aliases)
      ? body.aliases.map((item) => String(item).trim()).filter(Boolean)
      : [];
  }
  if (body.roles !== undefined) {
    updates.roles = parseRoles(body.roles);
  }
  if (body.email !== undefined) {
    updates.email = String(body.email).trim();
  }
  if (body.phone !== undefined) {
    updates.phone = String(body.phone).trim();
  }
  if (body.defaultHourlyRateCents !== undefined) {
    updates.defaultHourlyRateCents = parseOptionalRate(
      body.defaultHourlyRateCents
    );
  }
  if (body.notes !== undefined) {
    updates.notes = String(body.notes).trim();
  }
  if (body.status !== undefined) {
    const status = String(body.status) as ProviderStatus;
    if (!PROVIDER_STATUSES.includes(status)) {
      throw new ProviderValidationError("Invalid status");
    }
    updates.status = status;
  }
  if (body.archive === true) updates.archive = true;
  if (body.restore === true) updates.restore = true;

  return updates;
};
