import { serverSlackConfig } from "@/config/slack";
import type { SlackBlock } from "@/lib/integrations/slack/client";
import type { LeadRecord, LeadStatus } from "@/types/lead";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  intake_in_progress: "Intake in progress",
  intake_completed: "Intake completed",
  consult_scheduled: "Consult scheduled",
  consult_completed: "Consult completed",
  send_to_doula: "Send to Doula",
  proposal_sent: "Proposal sent",
  qualified: "Qualified",
  lost: "Lost",
  stale: "Stale",
  converted: "Converted",
  converted_to_member: "Converted to member",
  under_contract: "Under contract",
};

const adminLeadsUrl = () => `${serverSlackConfig.adminBaseUrl}/admin/leads`;

const sourceLabel = (lead: LeadRecord): string => {
  if (lead.source === "website") return "Website contact form";
  if (lead.isGuest) return "Public intake (guest)";
  return "Member intake";
};

const newLeadHeader = (lead: LeadRecord): string =>
  lead.source === "website" ? "New lead — website inquiry" : "New lead — AI intake";

const contactLine = (lead: LeadRecord): string => {
  const parts = [lead.email, lead.phone].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No contact yet";
};

const leadFields = (lead: LeadRecord): SlackBlock["fields"] => [
  { type: "mrkdwn", text: `*Name:*\n${lead.name || "—"}` },
  { type: "mrkdwn", text: `*Contact:*\n${contactLine(lead)}` },
  { type: "mrkdwn", text: `*Stage:*\n${lead.maternalStage ?? "—"}` },
  {
    type: "mrkdwn",
    text: `*Status:*\n${STATUS_LABELS[lead.status] ?? lead.status}`,
  },
  {
    type: "mrkdwn",
    text: `*Profile:*\n${lead.completionScore}% complete`,
  },
  {
    type: "mrkdwn",
    text: `*Source:*\n${sourceLabel(lead)}`,
  },
  {
    type: "mrkdwn",
    text: `*ZIP:*\n${lead.locationZip ?? "—"}`,
  },
];

export const buildNewLeadMessage = (lead: LeadRecord) => {
  const text = `New lead: ${lead.name || lead.leadId} (${STATUS_LABELS[lead.status]})`;
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: newLeadHeader(lead), emoji: true },
    },
    { type: "section", fields: leadFields(lead) },
  ];

  if (lead.supportInterests.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Service requested:*\n${lead.supportInterests.join(", ")}`,
      },
    });
  }

  if (lead.challengesSummary.trim()) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Message:*\n${lead.challengesSummary.trim()}`,
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `<${adminLeadsUrl()}|Open Lead CRM>`,
    },
  });

  return { text, blocks };
};

export const buildIntakeCompletedMessage = (lead: LeadRecord) => {
  const text = `Intake completed: ${lead.name || lead.leadId}`;
  const interests =
    lead.supportInterests.length > 0
      ? lead.supportInterests.join(", ")
      : "—";
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Intake completed — ready for coordinator",
        emoji: true,
      },
    },
    { type: "section", fields: leadFields(lead) },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Support interests:* ${interests}\n*Challenges:* ${lead.challengesSummary || "—"}`,
      },
    },
  ];
  return { text, blocks };
};

export const buildLeadStatusMessage = (
  lead: LeadRecord,
  previousStatus: LeadStatus
) => {
  const text = `Lead ${lead.name || lead.leadId}: ${STATUS_LABELS[previousStatus]} → ${STATUS_LABELS[lead.status]}`;
  const blocks: SlackBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Lead status updated*\n${lead.name || lead.leadId}\n${STATUS_LABELS[previousStatus]} → *${STATUS_LABELS[lead.status]}*`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Contact:*\n${contactLine(lead)}` },
        {
          type: "mrkdwn",
          text: `*Coordinator:*\n${lead.coordinatorEmail || "Unassigned"}`,
        },
      ],
    },
  ];
  return { text, blocks };
};

export const buildOutOfRegionLeadMessage = (
  lead: LeadRecord,
  zip: string,
  coverageMessage: string
) => {
  const text = `Out-of-region lead: ${lead.name || lead.leadId} — ZIP ${zip}`;
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Out-of-region lead — expansion opportunity",
        emoji: true,
      },
    },
    { type: "section", fields: leadFields(lead) },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*ZIP ${zip}* is outside current service areas.\n${coverageMessage}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${adminLeadsUrl()}|Open Lead CRM> · Consider waitlist follow-up or expansion planning`,
      },
    },
  ];
  return { text, blocks };
};

export interface ConsultBookedDetails {
  inviteeName: string;
  inviteeEmail: string;
  eventName: string;
  startTime: string;
  timezone?: string;
  bookingUrl?: string;
  leadId?: string;
}

export const buildConsultBookedMessage = (details: ConsultBookedDetails) => {
  const when = details.startTime
    ? new Date(details.startTime).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: details.timezone,
      })
    : "Time TBD";

  const text = `Consult booked: ${details.inviteeName} — ${when}`;
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Maternal Support Introductory Call scheduled",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Client:*\n${details.inviteeName}` },
        { type: "mrkdwn", text: `*Email:*\n${details.inviteeEmail || "—"}` },
        { type: "mrkdwn", text: `*Event:*\n${details.eventName}` },
        { type: "mrkdwn", text: `*When:*\n${when}` },
      ],
    },
  ];

  if (details.leadId) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${adminLeadsUrl()}|View Lead CRM> · Lead ID: \`${details.leadId}\``,
      },
    });
  } else {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${adminLeadsUrl()}|View Lead CRM>`,
      },
    });
  }

  return { text, blocks };
};
