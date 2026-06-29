import { normalizePhone } from "@/lib/intake/submitService";
import type { CreateClientInput, ClientRecord } from "@/types/client";
import {
  EMPTY_CLIENT_BILLING_SUMMARY,
  MANUAL_CLIENT_CHANNELS,
} from "@/types/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_CHANNELS = new Set(MANUAL_CLIENT_CHANNELS.map((item) => item.value));

export class ClientValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientValidationError";
  }
}

export const buildManualClientSource = (channel: string): string =>
  `manual_${channel}`;

export const validateCreateClientInput = (raw: unknown): CreateClientInput => {
  if (!raw || typeof raw !== "object") {
    throw new ClientValidationError("Malformed payload");
  }

  const body = raw as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = normalizePhone(String(body.phone ?? "").trim());
  const channel = String(body.channel ?? "")
    .trim() as CreateClientInput["channel"];
  const locationZip = body.locationZip ? String(body.locationZip).trim() : null;
  const homeAddress = body.homeAddress ? String(body.homeAddress).trim() : null;
  const notes = String(body.notes ?? "").trim();
  const coordinatorId = String(body.coordinatorId ?? "").trim();
  const leadId = body.leadId ? String(body.leadId).trim() : null;
  const cognitoSub = body.cognitoSub ? String(body.cognitoSub).trim() : null;

  if (!name) {
    throw new ClientValidationError("Name is required");
  }
  if (!phone && !email) {
    throw new ClientValidationError("Phone or email is required");
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new ClientValidationError("Invalid email address");
  }
  if (!VALID_CHANNELS.has(channel)) {
    throw new ClientValidationError("Invalid client channel");
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    name,
    email,
    phone,
    channel,
    leadId: leadId || null,
    cognitoSub: cognitoSub || null,
    locationZip: locationZip || null,
    homeAddress: homeAddress || null,
    tags,
    notes,
    coordinatorId: coordinatorId || undefined,
  };
};

export const buildManualClientRecord = (input: {
  clientId: string;
  payload: CreateClientInput;
  coordinator?: { id: string; email?: string };
}): ClientRecord => {
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
    clientId: input.clientId,
    status: "prospect",
    name: input.payload.name,
    email: input.payload.email ?? "",
    phone: input.payload.phone ?? "",
    leadId: input.payload.leadId ?? null,
    cognitoSub: input.payload.cognitoSub ?? null,
    source: buildManualClientSource(input.payload.channel),
    ...assignedCoordinator,
    tags: input.payload.tags ?? [],
    locationZip: input.payload.locationZip ?? null,
    homeAddress: input.payload.homeAddress ?? null,
    notesSummary: input.payload.notes ?? "",
    billing: { ...EMPTY_CLIENT_BILLING_SUMMARY },
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};
