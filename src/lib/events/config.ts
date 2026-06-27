import { hasExplicitServerCredentials } from "@/lib/aws/amplifyCredentials";
import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

const DEFAULT_BUCKET = "nurture-collective-tasks";
const PROD_EVENTS_KEY = "management/events/items.json";

const isLocalStorageEnabled = () => {
  if (process.env.EVENTS_USE_LOCAL_STORAGE === "true") return true;
  if (
    process.env.NODE_ENV === "development" &&
    !hasExplicitServerCredentials()
  ) {
    return true;
  }
  if (process.env.TASKS_S3_BUCKET?.trim()) return false;
  return process.env.NODE_ENV === "development";
};

/** Default S3 object key for the events CMS document (prod keeps the legacy path). */
export const resolveEventsS3Key = (
  env: Parameters<typeof resolveDeploymentEnvironment>[0] &
    Partial<Record<"EVENTS_S3_KEY", string | undefined>> = process.env
): string => {
  const explicit = env.EVENTS_S3_KEY?.trim();
  if (explicit) return explicit;

  const deployment = resolveDeploymentEnvironment(env);
  if (deployment === "prod") return PROD_EVENTS_KEY;
  return `management/events/${deployment}/items.json`;
};

export const eventsStorageConfig = {
  deploymentEnvironment: resolveDeploymentEnvironment(),
  bucket:
    process.env.EVENTS_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_BUCKET,
  s3Key: resolveEventsS3Key(),
  useLocalStorage: isLocalStorageEnabled(),
} as const;
