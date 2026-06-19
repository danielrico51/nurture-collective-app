import path from "path";
import type { ClientsCrmStorageScope } from "@/types/client";
import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

const normalizePrefix = (value: string): string =>
  value.endsWith("/") ? value : `${value}/`;

/**
 * S3/local root prefix for Client CRM records.
 * Prod keeps the legacy `crm/` root; dev/local use isolated scopes so tests
 * on the dev branch never touch prod data (even if a bucket is misconfigured).
 */
export const resolveClientsCrmPrefix = (
  env: Parameters<typeof resolveDeploymentEnvironment>[0] &
    Partial<Record<"CLIENTS_CRM_S3_PREFIX", string | undefined>> = process.env
): string => {
  const explicit = env.CLIENTS_CRM_S3_PREFIX?.trim();
  if (explicit) return normalizePrefix(explicit);

  const deployment = resolveDeploymentEnvironment(env);
  if (deployment === "prod") return "crm/";
  return `crm/${deployment}/`;
};

/** Primary bucket for client CRM + proposals (set per Amplify branch). */
export const getClientsCrmBucket = (): string =>
  process.env.NURTURE_CLIENTS_BUCKET?.trim() ||
  process.env.NURTURE_PROPOSALS_BUCKET?.trim() ||
  process.env.BILLING_S3_BUCKET?.trim() ||
  "";

export const getClientsStorageMode = (): "local" | "s3" => {
  if (process.env.CLIENTS_CRM_USE_LOCAL_STORAGE === "true") return "local";
  if (process.env.CLIENTS_CRM_USE_S3 === "true" && getClientsCrmBucket()) {
    return "s3";
  }
  if (!getClientsCrmBucket()) {
    return process.env.NODE_ENV === "development" ? "local" : "s3";
  }
  // Bucket configured: default to local in dev (matches leads/proposals), S3 in prod.
  return process.env.NODE_ENV === "development" ? "local" : "s3";
};

export const clientsCrmStorageConfig = {
  deploymentEnvironment: resolveDeploymentEnvironment(),
  s3Prefix: resolveClientsCrmPrefix(),
  bucket: getClientsCrmBucket(),
  useLocalStorage: getClientsStorageMode() === "local",
  localDataRoot: path.join(
    process.cwd(),
    ".data",
    "nurture-clients-crm",
    resolveDeploymentEnvironment()
  ),
} as const;

/** API/UI payload describing where CRM-linked data (clients, providers, schedule) is stored. */
export const getClientsCrmStorageScope = (): ClientsCrmStorageScope => ({
  deploymentEnvironment: resolveDeploymentEnvironment(),
  scope: resolveClientsCrmPrefix(),
});

export const describeClientsCrmStorageScope = (
  storage: ClientsCrmStorageScope,
  options?: { prodLabel?: string }
): string => {
  if (storage.deploymentEnvironment === "prod") {
    return options?.prodLabel ?? "Production data";
  }
  return `Isolated ${storage.deploymentEnvironment} scope (${storage.scope}) — changes here do not affect prod.`;
};

export const isClientsCrmStorageConfigured = (): boolean =>
  clientsCrmStorageConfig.useLocalStorage || Boolean(getClientsCrmBucket());
