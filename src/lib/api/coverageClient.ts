import type { CoverageConfig, CoverageConfigWithMeta } from "@/types/coverage";

const stripCoverageMeta = (payload: CoverageConfigWithMeta): CoverageConfig => {
  const { _storage: _ignored, ...config } = payload;
  return config;
};

const authHeaders = async (): Promise<HeadersInit> => {
  const { fetchAuthSession } = await import("aws-amplify/auth");
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const fetchPublicCoverage = async (): Promise<CoverageConfig> => {
  const response = await fetch("/api/coverage", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load coverage");
  return response.json();
};

export type AdminCoverageResult = {
  config: CoverageConfig;
  storageWarning?: string;
  usingSavedConfig: boolean;
};

export const fetchAdminCoverage = async (): Promise<AdminCoverageResult> => {
  const response = await fetch("/api/admin/coverage", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Could not load coverage");
  }
  const payload = (await response.json()) as CoverageConfigWithMeta;
  const config = stripCoverageMeta(payload);
  const warning = payload._storage?.warning;
  const usingSavedConfig = payload._storage?.source === "s3";
  return {
    config,
    storageWarning: warning,
    usingSavedConfig,
  };
};

export interface ReverseGeocodeResult {
  zip: string;
  prefix: string;
  label: string;
}

export const reverseGeocodeCoveragePoint = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> => {
  const response = await fetch(
    `/api/admin/coverage/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Could not reverse geocode"
    );
  }
  return response.json();
};

export const saveAdminCoverage = async (
  config: CoverageConfig
): Promise<CoverageConfig> => {
  const response = await fetch("/api/admin/coverage", {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Could not save coverage");
  }
  return stripCoverageMeta((await response.json()) as CoverageConfigWithMeta);
};
