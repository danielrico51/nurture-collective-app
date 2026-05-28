export type SlackChannelKey =
  | "newLeads"
  | "scheduledCalls"
  | "operations"
  | "lostLeads";

/** Server-only Slack config for intake & conversion process notifications. */
export const serverSlackConfig = {
  enabled: process.env.SLACK_ENABLED === "true",
  botToken: process.env.SLACK_BOT_TOKEN?.trim() ?? "",
  webhooks: {
    newLeads: process.env.SLACK_WEBHOOK_NEW_LEADS?.trim() ?? "",
    scheduledCalls: process.env.SLACK_WEBHOOK_SCHEDULED_CALLS?.trim() ?? "",
    operations: process.env.SLACK_WEBHOOK_OPERATIONS?.trim() ?? "",
    lostLeads: process.env.SLACK_WEBHOOK_LOST_LEADS?.trim() ?? "",
  },
  channels: {
    newLeads: process.env.SLACK_CHANNEL_NEW_LEADS?.trim() ?? "dev-new-leads",
    scheduledCalls:
      process.env.SLACK_CHANNEL_SCHEDULED_CALLS?.trim() ?? "dev-scheduled-calls",
    operations: process.env.SLACK_CHANNEL_OPERATIONS?.trim() ?? "dev-operations",
    lostLeads: process.env.SLACK_CHANNEL_LOST_LEADS?.trim() ?? "dev-lost-leads",
  },
  adminBaseUrl:
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.SLACK_ADMIN_BASE_URL?.trim() ||
    "http://localhost:3000",
} as const;

export const isSlackConfigured = (): boolean => {
  if (!serverSlackConfig.enabled) return false;
  const { botToken, webhooks } = serverSlackConfig;
  if (botToken) return true;
  return Object.values(webhooks).some(Boolean);
};

export const getSlackWebhookForChannel = (
  channel: SlackChannelKey
): string => serverSlackConfig.webhooks[channel];

export const getSlackChannelName = (channel: SlackChannelKey): string =>
  serverSlackConfig.channels[channel];
