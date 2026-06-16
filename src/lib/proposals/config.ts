import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

const DEFAULT_TASKS_BUCKET = "nurture-collective-tasks";

const normalizePrefix = (value: string): string =>
  value.endsWith("/") ? value : `${value}/`;

/** Primary bucket for client proposal partitions (`clients/client_id=…/proposals/…`). */
export const getProposalsBucket = (): string =>
  process.env.NURTURE_CLIENTS_BUCKET?.trim() ||
  process.env.NURTURE_PROPOSALS_BUCKET?.trim() ||
  process.env.BILLING_S3_BUCKET?.trim() ||
  "";

/**
 * Default S3 prefix for the proposal style library when stored in a shared tasks bucket.
 * Production keeps the legacy `proposal-library/` root; dev/local use scoped prefixes.
 */
export const resolveProposalLibraryPrefix = (
  env: Parameters<typeof resolveDeploymentEnvironment>[0] &
    Partial<Record<"PROPOSAL_LIBRARY_S3_PREFIX", string | undefined>> = process.env
): string => {
  const explicit = env.PROPOSAL_LIBRARY_S3_PREFIX?.trim();
  if (explicit) return normalizePrefix(explicit);

  const deployment = resolveDeploymentEnvironment(env);
  if (deployment === "prod") return "proposal-library/";
  return `proposal-library/${deployment}/`;
};

const readEnvScopedValue = (
  env: Parameters<typeof resolveDeploymentEnvironment>[0] &
    Record<string, string | undefined>,
  keys: { explicit?: string; dev: string; prod: string }
): string => {
  const explicit = keys.explicit ? env[keys.explicit]?.trim() : "";
  if (explicit) return explicit;

  const deployment = resolveDeploymentEnvironment(env);
  if (deployment === "prod") {
    return env[keys.prod]?.trim() || "";
  }
  return env[keys.dev]?.trim() || env[keys.prod]?.trim() || "";
};

/** Drive folder for generated proposal copies (dev vs prod folders in admin@ Drive). */
export const resolveGoogleProposalDriveFolderId = (
  env: Parameters<typeof resolveDeploymentEnvironment>[0] &
    Partial<
      Record<
        | "GOOGLE_PROPOSAL_DRIVE_FOLDER_ID"
        | "GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_DEV"
        | "GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_PROD",
        string | undefined
      >
    > = process.env
): string =>
  readEnvScopedValue(env, {
    explicit: "GOOGLE_PROPOSAL_DRIVE_FOLDER_ID",
    dev: "GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_DEV",
    prod: "GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_PROD",
  });

/** Master Google Doc template (may differ between dev and prod). */
export const resolveGoogleProposalTemplateDocId = (
  env: Parameters<typeof resolveDeploymentEnvironment>[0] &
    Partial<
      Record<
        | "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID"
        | "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_DEV"
        | "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_PROD",
        string | undefined
      >
    > = process.env
): string =>
  readEnvScopedValue(env, {
    explicit: "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID",
    dev: "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_DEV",
    prod: "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_PROD",
  });

export const getProposalsStorageMode = (): "local" | "s3" => {
  if (process.env.PROPOSALS_USE_LOCAL_STORAGE === "true") return "local";
  if (process.env.PROPOSALS_USE_S3 === "true" && getProposalsBucket()) return "s3";
  if (!getProposalsBucket()) {
    return process.env.NODE_ENV === "development" ? "local" : "s3";
  }
  // Bucket configured: local only on developer machines (matches leads/billing).
  return process.env.NODE_ENV === "development" ? "local" : "s3";
};

export const proposalsStorageConfig = {
  deploymentEnvironment: resolveDeploymentEnvironment(),
  clientsBucket:
    getProposalsBucket() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_TASKS_BUCKET,
  libraryBucket:
    process.env.PROPOSAL_LIBRARY_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_TASKS_BUCKET,
  libraryPrefix: resolveProposalLibraryPrefix(),
  useLocalStorage: getProposalsStorageMode() === "local",
  googleTemplateDocId: resolveGoogleProposalTemplateDocId(),
  googleDriveFolderId: resolveGoogleProposalDriveFolderId(),
  signatureWebhookSecret:
    process.env.PROPOSAL_SIGNATURE_WEBHOOK_SECRET?.trim() ||
    process.env.N8N_WEBHOOK_SECRET?.trim() ||
    "",
} as const;

export const isProposalsStorageConfigured = (): boolean =>
  proposalsStorageConfig.useLocalStorage || Boolean(getProposalsBucket());
