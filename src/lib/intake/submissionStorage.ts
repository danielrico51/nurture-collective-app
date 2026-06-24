import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { intakeSubmitConfig } from "@/config/intakeSubmit";
import {
  buildDeadLetterIntakeKey,
  buildHistoricalIntakeKey,
} from "@/lib/intake/submissionPaths";
import type { EnrichedIntakeLead } from "@/types/intakeSubmission";
import { appendLocalLeadProfile } from "@/lib/leads/localStorage";
import { appendS3LeadProfile } from "@/lib/leads/platformS3";
import { notifyLeadPipelineEvent } from "@/lib/integrations/slack/pipeline";
import { LEAD_SNAPSHOT_DEFAULTS } from "@/lib/leads/snapshotDefaults";
import type { LeadRecord } from "@/types/lead";
import fs from "node:fs/promises";
import path from "node:path";

const getS3Client = () =>
  new S3Client({
    region: intakeSubmitConfig.awsRegion,
    credentials: getServerCredentials(),
  });

export const getIntakeStorageMode = (): "local" | "s3" => {
  if (process.env.LEADS_USE_LOCAL_STORAGE === "true") return "local";
  if (process.env.LEADS_USE_S3 === "true" && intakeSubmitConfig.leadsBucket) {
    return "s3";
  }
  if (!intakeSubmitConfig.leadsBucket) {
    return process.env.NODE_ENV === "development" ? "local" : "s3";
  }
  return process.env.NODE_ENV === "development" ? "local" : "s3";
};

const localHistoricalRoot = path.join(
  process.cwd(),
  ".data",
  "intake-submissions"
);

const writeLocalHistorical = async (
  key: string,
  payload: unknown
): Promise<string> => {
  const filePath = path.join(localHistoricalRoot, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return filePath;
};

const writeS3Historical = async (
  key: string,
  payload: unknown
): Promise<string> => {
  const Bucket = intakeSubmitConfig.leadsBucket;
  if (!Bucket) {
    throw new Error("LEADS_BUCKET is not configured");
  }
  await getS3Client().send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
  return key;
};

export const storeHistoricalIntakeLead = async (
  lead: EnrichedIntakeLead
): Promise<string> => {
  const key = buildHistoricalIntakeKey(lead.lead_id);
  if (getIntakeStorageMode() === "local") {
    return writeLocalHistorical(key, lead);
  }
  return writeS3Historical(key, lead);
};

export const storeDeadLetterIntakeLead = async (
  lead: EnrichedIntakeLead,
  reason: string,
  error: unknown
): Promise<string | null> => {
  const payload = {
    ...lead,
    dead_letter_reason: reason,
    dead_letter_error:
      error instanceof Error ? error.message : String(error ?? "unknown"),
    dead_letter_at: new Date().toISOString(),
  };
  const key = buildDeadLetterIntakeKey(lead.lead_id, reason);
  try {
    if (getIntakeStorageMode() === "local") {
      return writeLocalHistorical(key, payload);
    }
    return writeS3Historical(key, payload);
  } catch (storeError) {
    console.error("[intake-submit] dead letter write failed:", storeError);
    return null;
  }
};

export const buildCrmLeadFromSubmission = (
  lead: EnrichedIntakeLead
): LeadRecord => {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return {
    leadId: lead.lead_id,
    userId: lead.lead_id,
    status: "new",
    name,
    email: lead.email,
    phone: lead.phone,
    maternalStage: null,
    source: lead.lead_source,
    isGuest: true,
    coordinatorId: "",
    coordinatorEmail: "",
    intakeStatus: null,
    completionScore: 0,
    supportInterests: lead.service_requested ? [lead.service_requested] : [],
    challengesSummary: lead.message,
    locationZip: null,
    ...LEAD_SNAPSHOT_DEFAULTS,
    archivedAt: null,
    conversationSessionId: null,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  };
};

export const storeCrmLeadSnapshot = async (
  lead: EnrichedIntakeLead
): Promise<string | null> => {
  const record = buildCrmLeadFromSubmission(lead);
  try {
    const key =
      getIntakeStorageMode() === "local"
        ? await appendLocalLeadProfile(record)
        : await appendS3LeadProfile(record);

    await notifyLeadPipelineEvent({ previous: null, current: record }).catch(
      (error) => {
        console.error("[intake-submit] Slack notification failed:", error);
      }
    );

    return key;
  } catch (error) {
    console.error("[intake-submit] CRM lead snapshot failed:", error);
    return null;
  }
};
