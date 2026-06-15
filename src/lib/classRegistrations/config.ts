import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

const DEFAULT_BUCKET = "nurture-collective-tasks";

const normalizePrefix = (value: string): string =>
  value.endsWith("/") ? value : `${value}/`;

/** Default S3 prefix for class registrations (prod keeps the legacy path). */
export const resolveClassRegistrationS3Prefix = (
  env: Parameters<typeof resolveDeploymentEnvironment>[0] &
    Partial<Record<"CLASS_REGISTRATIONS_S3_PREFIX", string | undefined>> = process.env
): string => {
  const explicit = env.CLASS_REGISTRATIONS_S3_PREFIX?.trim();
  if (explicit) return normalizePrefix(explicit);

  const deployment = resolveDeploymentEnvironment(env);
  if (deployment === "prod") return "class-registrations/";
  return `class-registrations/${deployment}/`;
};

export const classRegistrationConfig = {
  deploymentEnvironment: resolveDeploymentEnvironment(),
  s3Prefix: resolveClassRegistrationS3Prefix(),
  s3Bucket:
    process.env.CLASS_REGISTRATIONS_S3_BUCKET?.trim() ||
    process.env.EVENTS_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_BUCKET,
  useLocalStorage:
    process.env.CLASS_REGISTRATIONS_USE_LOCAL_STORAGE === "true" ||
    (process.env.NODE_ENV === "development" &&
      !process.env.CLASS_REGISTRATIONS_S3_BUCKET?.trim() &&
      !process.env.EVENTS_S3_BUCKET?.trim() &&
      !process.env.TASKS_S3_BUCKET?.trim()),
} as const;
