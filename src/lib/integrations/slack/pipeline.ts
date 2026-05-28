import { postSlackMessage } from "@/lib/integrations/slack/client";
import {
  buildConsultBookedMessage,
  buildIntakeCompletedMessage,
  buildLeadStatusMessage,
  buildNewLeadMessage,
  buildOutOfRegionLeadMessage,
  type ConsultBookedDetails,
} from "@/lib/integrations/slack/messages";
import { getCoverageConfig } from "@/lib/coverage/storage";
import { resolveCoverageForZip } from "@/lib/coverage/resolve";
import type { LeadRecord, LeadStatus } from "@/types/lead";

const hasCoordinatorContact = (lead: LeadRecord): boolean =>
  Boolean(lead.name.trim() && (lead.email.trim() || lead.phone.trim()));

export const shouldNotifyNewLead = (
  previous: LeadRecord | null,
  current: LeadRecord
): boolean => {
  if (!hasCoordinatorContact(current)) return false;
  if (!previous) return true;
  return !hasCoordinatorContact(previous);
};

export const shouldNotifyIntakeCompleted = (
  previous: LeadRecord | null,
  current: LeadRecord,
  hasSubmittedIntake?: boolean
): boolean =>
  Boolean(hasSubmittedIntake) &&
  current.status === "intake_completed" &&
  previous?.status !== "intake_completed";

export const shouldNotifyStatusChange = (
  previous: LeadRecord | null,
  current: LeadRecord
): boolean =>
  Boolean(previous && previous.status !== current.status);

export const shouldNotifyOutOfRegion = (
  previous: LeadRecord | null,
  current: LeadRecord,
  coverageStatus: "outside" | "active" | "expanding" | "waitlist"
): boolean => {
  const zip = current.locationZip?.trim();
  if (!zip) return false;
  if (previous?.locationZip?.trim() === zip) return false;
  return coverageStatus === "outside";
};

export const resolveStatusChangeChannel = (
  status: LeadStatus
): "scheduledCalls" | "operations" | "lostLeads" | "newLeads" => {
  if (status === "consult_scheduled") return "scheduledCalls";
  if (status === "lost" || status === "stale") return "lostLeads";
  if (status === "converted" || status === "converted_to_member" || status === "under_contract" || status === "proposal_sent") {
    return "operations";
  }
  return "newLeads";
};

export const notifyNewLead = async (lead: LeadRecord): Promise<void> => {
  const { text, blocks } = buildNewLeadMessage(lead);
  await postSlackMessage({ channel: "newLeads", text, blocks });
};

export const notifyIntakeCompleted = async (lead: LeadRecord): Promise<void> => {
  const { text, blocks } = buildIntakeCompletedMessage(lead);
  await postSlackMessage({ channel: "newLeads", text, blocks });
};

export const notifyLeadStatusChanged = async (
  lead: LeadRecord,
  previousStatus: LeadStatus
): Promise<void> => {
  const { text, blocks } = buildLeadStatusMessage(lead, previousStatus);
  await postSlackMessage({
    channel: resolveStatusChangeChannel(lead.status),
    text,
    blocks,
  });
};

export const notifyConsultBooked = async (
  details: ConsultBookedDetails
): Promise<void> => {
  const { text, blocks } = buildConsultBookedMessage(details);
  await postSlackMessage({ channel: "scheduledCalls", text, blocks });
};

export const notifyOutOfRegionLead = async (
  lead: LeadRecord,
  zip: string,
  coverageMessage: string
): Promise<void> => {
  const { text, blocks } = buildOutOfRegionLeadMessage(lead, zip, coverageMessage);
  await postSlackMessage({ channel: "newLeads", text, blocks });
};

export const notifyLeadPipelineEvent = async (input: {
  previous: LeadRecord | null;
  current: LeadRecord;
  hasSubmittedIntake?: boolean;
}): Promise<void> => {
  const { previous, current, hasSubmittedIntake } = input;

  if (shouldNotifyNewLead(previous, current)) {
    await notifyNewLead(current);
  }

  if (shouldNotifyIntakeCompleted(previous, current, hasSubmittedIntake)) {
    await notifyIntakeCompleted(current);
  }

  if (shouldNotifyStatusChange(previous, current) && previous) {
    await notifyLeadStatusChanged(current, previous.status);
  }

  const zip = current.locationZip?.trim();
  const previousZip = previous?.locationZip?.trim();
  if (zip && zip !== previousZip) {
    const config = await getCoverageConfig();
    const coverage = resolveCoverageForZip(zip, config);
    if (shouldNotifyOutOfRegion(previous, current, coverage.status)) {
      await notifyOutOfRegionLead(current, zip, coverage.message);
    }
  }
};
