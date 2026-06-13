import "server-only";

const trim = (value: string | undefined): string => value?.trim() ?? "";

export type GoogleWorkloadIdentityConfig = {
  projectNumber: string;
  poolId: string;
  providerId: string;
  serviceAccountEmail: string;
};

const defaultServiceAccount = () =>
  process.env.GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT?.trim() ||
  process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
  process.env.GOOGLE_CALENDAR_IMPERSONATE_SERVICE_ACCOUNT?.trim() ||
  "nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com";

export const getGoogleWorkloadIdentityConfig = (): GoogleWorkloadIdentityConfig | null => {
  const projectNumber = trim(process.env.GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER);
  const poolId = trim(process.env.GOOGLE_WORKLOAD_IDENTITY_POOL_ID);
  const providerId = trim(process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID);
  const serviceAccountEmail = defaultServiceAccount();

  if (!projectNumber || !poolId || !providerId || !serviceAccountEmail) {
    return null;
  }

  return { projectNumber, poolId, providerId, serviceAccountEmail };
};

export const isGoogleWorkloadIdentityConfigured = (): boolean =>
  getGoogleWorkloadIdentityConfig() !== null;

export const prefersWorkloadIdentityAuth = (): boolean => {
  const mode =
    process.env.GOOGLE_CALENDAR_AUTH_MODE?.trim().toLowerCase() ||
    process.env.GOOGLE_TASKS_AUTH_MODE?.trim().toLowerCase();
  if (mode === "wif") return isGoogleWorkloadIdentityConfigured();
  if (mode === "delegated" || mode === "adc" || mode === "impersonate") {
    return isGoogleWorkloadIdentityConfigured();
  }
  return false;
};
