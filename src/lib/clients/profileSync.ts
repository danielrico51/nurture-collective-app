import { updateMemberProfileAttributes } from "@/lib/auth/cognitoAdmin";
import { normalizePhone } from "@/lib/intake/submitService";
import { getLeadById, updateLeadContactInfo } from "@/lib/leads/storage";
import type { ClientRecord, UpdateClientInput } from "@/types/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ClientUpdateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientUpdateValidationError";
  }
}

export const validateUpdateClientInput = (
  raw: UpdateClientInput
): UpdateClientInput => {
  const updates: UpdateClientInput = { ...raw };

  if (updates.name !== undefined) {
    updates.name = String(updates.name).trim();
    if (!updates.name) {
      throw new ClientUpdateValidationError("Name cannot be empty");
    }
  }

  if (updates.email !== undefined) {
    updates.email = String(updates.email).trim();
    if (updates.email && !EMAIL_PATTERN.test(updates.email)) {
      throw new ClientUpdateValidationError("Invalid email address");
    }
  }

  if (updates.phone !== undefined) {
    updates.phone = normalizePhone(String(updates.phone).trim());
  }

  if (updates.locationZip !== undefined && updates.locationZip) {
    updates.locationZip = String(updates.locationZip).trim();
  }

  if (updates.homeAddress !== undefined) {
    updates.homeAddress = updates.homeAddress
      ? String(updates.homeAddress).trim()
      : null;
  }

  if (updates.tags !== undefined) {
    updates.tags = updates.tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (updates.notesSummary !== undefined) {
    updates.notesSummary = String(updates.notesSummary).trim();
  }

  return updates;
};

export const propagateClientProfileChanges = async (
  previous: ClientRecord,
  updated: ClientRecord
): Promise<void> => {
  const contactChanged =
    previous.name !== updated.name ||
    previous.email !== updated.email ||
    previous.phone !== updated.phone ||
    previous.locationZip !== updated.locationZip ||
    (previous.homeAddress ?? null) !== (updated.homeAddress ?? null);

  if (!contactChanged) return;

  if (updated.leadId) {
    try {
      const lead = await getLeadById(updated.leadId);
      if (lead) {
        await updateLeadContactInfo(updated.leadId, {
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          locationZip: updated.locationZip,
          locationAddress: updated.homeAddress ?? null,
        });
      }
    } catch (error) {
      console.error("[clients] lead profile sync failed:", error);
    }
  }

  if (updated.cognitoSub) {
    try {
      const attributes: Record<string, string> = {};
      if (updated.name) {
        attributes.name = updated.name;
        const parts = updated.name.trim().split(/\s+/);
        attributes.given_name = parts[0] ?? updated.name;
        attributes.family_name = parts.slice(1).join(" ") || parts[0] || "";
      }
      if (updated.email) attributes.email = updated.email;
      if (updated.phone) attributes.phone_number = updated.phone;
      if (updated.homeAddress) attributes.address = updated.homeAddress;
      else if (updated.locationZip) attributes.address = updated.locationZip;

      await updateMemberProfileAttributes({
        cognitoUsername: updated.cognitoSub,
        sub: updated.cognitoSub,
        attributes,
      });
    } catch (error) {
      console.error("[clients] cognito profile sync failed:", error);
    }
  }
};
