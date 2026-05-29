export type CoverageStatus = "active" | "expanding" | "waitlist";

export interface CoverageGeoPoint {
  lat: number;
  lng: number;
}

export interface CoverageRegionConfig {
  id: string;
  name: string;
  status: CoverageStatus;
  services: string;
  /** Match US ZIP codes by 3-digit prefix (e.g. "076" for Bergen County). */
  zipPrefixes: string[];
  center: CoverageGeoPoint;
  /** Visual / matching radius in miles */
  radiusMiles: number;
  /** 0–100 — how fully we serve this region as we expand */
  coverageRatio: number;
  /** Optional override for concierge when discussing this region */
  conciergeNote?: string;
}

export interface CoverageConfig {
  version: number;
  updatedAt: string;
  updatedBy?: string;
  intro: string;
  regions: CoverageRegionConfig[];
}

export type CoverageStorageSource = "s3" | "local" | "defaults";

/** Optional metadata on admin coverage API responses. */
export interface CoverageStorageMeta {
  source: CoverageStorageSource;
  warning?: string;
}

export type CoverageConfigWithMeta = CoverageConfig & {
  _storage?: CoverageStorageMeta;
};

export type CoverageLookupResult =
  | {
      match: true;
      region: CoverageRegionConfig;
      status: CoverageStatus;
      message: string;
    }
  | {
      match: false;
      status: "outside";
      message: string;
    };
