/** Server-only intake submit pipeline configuration. */
export const intakeSubmitConfig = {
  n8nWebhookUrl:
    process.env.N8N_WEBHOOK_URL?.trim() ||
    process.env.N8N_INQUIRY_WEBHOOK_URL?.trim() ||
    "",
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET?.trim() ?? "",
  awsRegion:
    process.env.AWS_REGION?.trim() ||
    process.env.NEXT_PUBLIC_AWS_REGION?.trim() ||
    "us-east-1",
  leadsBucket:
    process.env.LEADS_BUCKET?.trim() ||
    process.env.NURTURE_LEADS_BUCKET?.trim() ||
    "",
  intakeTimeoutMs: Math.max(
    1,
    Number.parseInt(process.env.INTAKE_TIMEOUT ?? "15", 10)
  ) * 1000,
  maxRetries: Math.max(
    0,
    Number.parseInt(process.env.MAX_RETRIES ?? "3", 10)
  ),
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 10,
} as const;
