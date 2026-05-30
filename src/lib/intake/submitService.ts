import { randomUUID } from "node:crypto";
import { intakeSubmitConfig } from "@/config/intakeSubmit";
import {
  storeCrmLeadSnapshot,
  storeDeadLetterIntakeLead,
  storeHistoricalIntakeLead,
} from "@/lib/intake/submissionStorage";
import type {
  EnrichedIntakeLead,
  IntakeSubmitRequest,
} from "@/types/intakeSubmission";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class IntakeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntakeValidationError";
  }
}

export class IntakePipelineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntakePipelineError";
  }
}

const digitsOnly = (value: string): string => value.replace(/\D/g, "");

export const normalizePhone = (phone: string | undefined): string => {
  if (!phone?.trim()) return "";
  const digits = digitsOnly(phone);
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (phone.trim().startsWith("+")) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : "";
};

export const validatePayload = (raw: unknown): IntakeSubmitRequest => {
  if (!raw || typeof raw !== "object") {
    throw new IntakeValidationError("Malformed payload");
  }

  const body = raw as Record<string, unknown>;
  const firstName = String(body.first_name ?? "").trim();
  const lastName = String(body.last_name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();
  const serviceRequested = String(body.service_requested ?? "").trim();
  const message = String(body.message ?? "").trim();
  const source = String(body.source ?? "website").trim() || "website";

  if (!firstName) {
    throw new IntakeValidationError("first_name is required");
  }
  if (!serviceRequested) {
    throw new IntakeValidationError("service_requested is required");
  }
  if (!phone && !email) {
    throw new IntakeValidationError("phone or email is required");
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new IntakeValidationError("Invalid email address");
  }
  if (!phone && !email && !message) {
    throw new IntakeValidationError("Empty submission");
  }

  return {
    first_name: firstName,
    last_name: lastName,
    phone: phone || undefined,
    email: email || undefined,
    service_requested: serviceRequested,
    message: message || undefined,
    source,
  };
};

export const normalizePayload = (
  payload: IntakeSubmitRequest
): IntakeSubmitRequest => ({
  first_name: payload.first_name.trim(),
  last_name: payload.last_name?.trim() ?? "",
  phone: normalizePhone(payload.phone) || undefined,
  email: payload.email?.trim().toLowerCase() ?? undefined,
  service_requested: payload.service_requested.trim(),
  message: payload.message?.trim() ?? "",
  source: payload.source?.trim() || "website",
});

export const enrichPayload = (
  payload: IntakeSubmitRequest
): EnrichedIntakeLead => {
  const now = new Date().toISOString();
  return {
    lead_id: randomUUID(),
    created_at: now,
    updated_at: now,
    status: "new",
    version: 1,
    lead_source: payload.source?.trim() || "website",
    first_name: payload.first_name,
    last_name: payload.last_name ?? "",
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    service_requested: payload.service_requested,
    message: payload.message ?? "",
  };
};

export const logSubmission = (
  event: string,
  details: Record<string, unknown>
): void => {
  console.info(
    JSON.stringify({
      scope: "intake-submit",
      event,
      at: new Date().toISOString(),
      ...details,
    })
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendToN8n = async (
  payload: EnrichedIntakeLead
): Promise<{ forwarded: boolean }> => {
  const webhookUrl = intakeSubmitConfig.n8nWebhookUrl;
  if (!webhookUrl) {
    logSubmission("n8n_skipped", { lead_id: payload.lead_id, reason: "not_configured" });
    return { forwarded: false };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (intakeSubmitConfig.n8nWebhookSecret) {
    headers.Authorization = `Bearer ${intakeSubmitConfig.n8nWebhookSecret}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    intakeSubmitConfig.intakeTimeoutMs
  );

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new IntakePipelineError(
        `n8n webhook failed with status ${response.status}`
      );
    }
    return { forwarded: true };
  } finally {
    clearTimeout(timeout);
  }
};

export const retryFailures = async <T>(
  label: string,
  fn: () => Promise<T>,
  maxRetries = intakeSubmitConfig.maxRetries
): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logSubmission("retry", {
        label,
        attempt,
        max_retries: maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt > maxRetries) break;
      await sleep(Math.min(1000 * attempt, 4000));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new IntakePipelineError(`${label} failed after retries`);
};

export interface IntakeSubmitResult {
  lead_id: string;
  forwarded: boolean;
  stored: boolean;
}

export const submitIntakeWorkflow = async (
  rawPayload: unknown
): Promise<IntakeSubmitResult> => {
  const validated = validatePayload(rawPayload);
  const normalized = normalizePayload(validated);
  const enriched = enrichPayload(normalized);

  logSubmission("received", {
    lead_id: enriched.lead_id,
    lead_source: enriched.lead_source,
    service_requested: enriched.service_requested,
    has_phone: Boolean(enriched.phone),
    has_email: Boolean(enriched.email),
  });

  let stored = false;
  try {
    await retryFailures("historical_storage", () =>
      storeHistoricalIntakeLead(enriched)
    );
    stored = true;
    logSubmission("stored", { lead_id: enriched.lead_id });
  } catch (error) {
    logSubmission("storage_failed", {
      lead_id: enriched.lead_id,
      error: error instanceof Error ? error.message : String(error),
    });
    await storeDeadLetterIntakeLead(enriched, "historical_storage", error);
    throw new IntakePipelineError("Could not store intake submission");
  }

  await storeCrmLeadSnapshot(enriched);
  logSubmission("crm_snapshot_saved", { lead_id: enriched.lead_id });

  let forwarded = false;
  try {
    const result = await retryFailures("n8n_forward", () => sendToN8n(enriched));
    forwarded = result.forwarded;
    logSubmission("n8n_forwarded", {
      lead_id: enriched.lead_id,
      forwarded,
    });
  } catch (error) {
    logSubmission("n8n_failed", {
      lead_id: enriched.lead_id,
      error: error instanceof Error ? error.message : String(error),
    });
    await storeDeadLetterIntakeLead(enriched, "n8n_forward", error);
    throw new IntakePipelineError(
      "Lead saved, but automation handoff failed. Our team has been notified."
    );
  }

  return {
    lead_id: enriched.lead_id,
    forwarded,
    stored,
  };
};

export const getIntakeHealth = async (): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  n8n: "connected" | "configured" | "not_configured";
  storage: "ready" | "local" | "not_configured";
}> => {
  const hasWebhook = Boolean(intakeSubmitConfig.n8nWebhookUrl);
  const hasBucket = Boolean(intakeSubmitConfig.leadsBucket);
  const storageMode =
    hasBucket || process.env.NODE_ENV === "development" ? "ready" : "not_configured";

  let n8n: "connected" | "configured" | "not_configured" = "not_configured";
  if (hasWebhook) {
    n8n = "configured";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(intakeSubmitConfig.n8nWebhookUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: intakeSubmitConfig.n8nWebhookSecret
          ? { Authorization: `Bearer ${intakeSubmitConfig.n8nWebhookSecret}` }
          : undefined,
      }).catch(() => null);
      clearTimeout(timeout);
      if (response && response.status < 500) {
        n8n = "connected";
      }
    } catch {
      n8n = "configured";
    }
  }

  const storage =
    process.env.LEADS_USE_LOCAL_STORAGE === "true" || !hasBucket
      ? "local"
      : storageMode;

  const status =
    storage === "not_configured" && process.env.NODE_ENV === "production"
      ? "degraded"
      : "healthy";

  return { status, n8n, storage };
};
