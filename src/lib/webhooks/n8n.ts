export interface N8nForwardResult {
  forwarded: boolean;
}

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
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`n8n webhook failed with status ${response.status}`);
  }

  return { forwarded: true };
};
