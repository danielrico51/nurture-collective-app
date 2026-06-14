import { normalizePhone } from "@/lib/intake/submitService";
import type { CreateManualLeadInput, LeadRecord } from "@/types/lead";
import { MANUAL_LEAD_CHANNELS } from "@/types/lead";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_CHANNELS = new Set(MANUAL_LEAD_CHANNELS.map((item) => item.value));

export class ManualLeadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualLeadValidationError";
  }
}

export const buildManualLeadSource = (channel: string): string =>
  `manual_${channel}`;

export const validateManualLeadInput = (
  raw: unknown
): CreateManualLeadInput => {
  if (!raw || typeof raw !== "object") {
    throw new ManualLeadValidationError("Malformed payload");
  }

  const body = raw as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = normalizePhone(String(body.phone ?? "").trim());
  const channel = String(body.channel ?? "").trim() as CreateManualLeadInput["channel"];
  const maternalStage = body.maternalStage
    ? String(body.maternalStage).trim()
    : null;
  const locationZip = body.locationZip ? String(body.locationZip).trim() : null;
  const notes = String(body.notes ?? "").trim();
  const coordinatorId = String(body.coordinatorId ?? "").trim();

  if (!name) {
    throw new ManualLeadValidationError("Name is required");
  }
  if (!phone && !email) {
    throw new ManualLeadValidationError("Phone or email is required");
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new ManualLeadValidationError("Invalid email address");
  }
  if (!VALID_CHANNELS.has(channel)) {
    throw new ManualLeadValidationError("Invalid lead channel");
  }

  const supportInterests = Array.isArray(body.supportInterests)
    ? body.supportInterests
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

  return {
    name,
    email,
    phone,
    channel,
    maternalStage: maternalStage || null,
    supportInterests,
    locationZip: locationZip || null,
    notes,
    coordinatorId: coordinatorId || undefined,
  };
};

export const buildManualLeadRecord = (input: {
  leadId: string;
  payload: CreateManualLeadInput;
  coordinator?: { id: string; email?: string };
}): LeadRecord => {
  const now = new Date().toISOString();
  const assignedCoordinator = input.coordinator?.id
    ? {
        coordinatorId: input.coordinator.id,
        coordinatorEmail: input.coordinator.email ?? "",
      }
    : {
        coordinatorId: "",
        coordinatorEmail: "",
      };

  return {
    leadId: input.leadId,
    userId: input.leadId,
    status: "new",
    name: input.payload.name,
    email: input.payload.email ?? "",
    phone: input.payload.phone ?? "",
    maternalStage: input.payload.maternalStage ?? null,
    source: buildManualLeadSource(input.payload.channel),
    isGuest: true,
    ...assignedCoordinator,
    intakeStatus: null,
    completionScore: 0,
    supportInterests: input.payload.supportInterests ?? [],
    challengesSummary: input.payload.notes ?? "",
    locationZip: input.payload.locationZip ?? null,
    archivedAt: null,
    conversationSessionId: null,
    createdAt: now,
    updatedAt: now,
  };
};
