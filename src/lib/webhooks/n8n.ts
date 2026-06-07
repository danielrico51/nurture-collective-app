import { serverIntegrations } from "@/config/integrations";

export interface N8nForwardResult {
  forwarded: boolean;
}

/** Attach team notification routing fields for n8n Gmail/SES nodes. */
export const buildN8nPayload = (payload: unknown): Record<string, unknown> => {
  const teamEmail = serverIntegrations.n8nTeamNotificationEmail;
  const base =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...(payload as Record<string, unknown>) }
      : { data: payload };

  return {
    ...base,
    team_notification_email: teamEmail,
    send_to: teamEmail,
    notification_email: teamEmail,
  };
};

export const forwardToN8n = async (
  webhookUrl: string | undefined,
  secret: string | undefined,
  payload: unknown
): Promise<N8nForwardResult> => {
  if (!webhookUrl) {
    console.info("[n8n] Webhook URL not configured, skipping forward");
    return { forwarded: false };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(buildN8nPayload(payload)),
  });

  if (!response.ok) {
    throw new Error(`n8n webhook failed with status ${response.status}`);
  }

  return { forwarded: true };
};
