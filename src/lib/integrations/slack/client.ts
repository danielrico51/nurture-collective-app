import {
  getSlackChannelName,
  getSlackWebhookForChannel,
  isSlackConfigured,
  serverSlackConfig,
  type SlackChannelKey,
} from "@/config/slack";

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: Array<{ type: string; text?: { type: string; text: string } }>;
}

export interface SlackMessagePayload {
  channel: SlackChannelKey;
  text: string;
  blocks?: SlackBlock[];
}

const postViaWebhook = async (
  webhookUrl: string,
  payload: { text: string; blocks?: SlackBlock[] }
): Promise<boolean> => {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Slack webhook failed (${response.status}): ${body}`);
  }
  return true;
};

const postViaBotToken = async (
  channelName: string,
  payload: { text: string; blocks?: SlackBlock[] }
): Promise<boolean> => {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${serverSlackConfig.botToken}`,
    },
    body: JSON.stringify({
      channel: channelName,
      text: payload.text,
      blocks: payload.blocks,
      unfurl_links: false,
    }),
  });

  const data = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? `Slack API failed (${response.status})`);
  }
  return true;
};

/** Post a message to a process-flow Slack channel (webhook preferred, bot token fallback). */
export const postSlackMessage = async ({
  channel,
  text,
  blocks,
}: SlackMessagePayload): Promise<boolean> => {
  if (!isSlackConfigured()) {
    console.info(`[slack] Skipped (${channel}): not configured`);
    return false;
  }

  const payload = { text, blocks };
  const webhookUrl = getSlackWebhookForChannel(channel);

  if (webhookUrl) {
    return postViaWebhook(webhookUrl, payload);
  }

  if (serverSlackConfig.botToken) {
    return postViaBotToken(getSlackChannelName(channel), payload);
  }

  console.info(`[slack] Skipped (${channel}): no webhook or bot token`);
  return false;
};
