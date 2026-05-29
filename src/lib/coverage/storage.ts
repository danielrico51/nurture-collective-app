import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEFAULT_COVERAGE_CONFIG } from "@/lib/coverage/defaults";
import {
  getIntakeBucket,
  readS3ObjectJson,
  writeS3ObjectJson,
} from "@/lib/intake/s3Storage";
import type {
  CoverageConfig,
  CoverageStorageMeta,
  CoverageStorageSource,
} from "@/types/coverage";

const COVERAGE_CONFIG_KEY = "platform/coverage/coverage-config.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "coverage", "coverage-config.json");

const isLocalCoverageStorage = (): boolean =>
  process.env.COVERAGE_USE_LOCAL_STORAGE === "true" ||
  (process.env.NODE_ENV === "development" && !getIntakeBucket());

let memoryCache: {
  config: CoverageConfig;
  meta: CoverageStorageMeta;
  loadedAt: number;
} | null = null;
const CACHE_TTL_MS = 15_000;

const normalizeConfig = (raw: Partial<CoverageConfig> | null): CoverageConfig => {
  if (!raw?.regions?.length) return { ...DEFAULT_COVERAGE_CONFIG };
  return {
    version: raw.version ?? 1,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    updatedBy: raw.updatedBy,
    intro: raw.intro ?? DEFAULT_COVERAGE_CONFIG.intro,
    regions: raw.regions.map((region) => ({
      ...region,
      zipPrefixes: region.zipPrefixes ?? [],
      coverageRatio: Math.min(100, Math.max(0, region.coverageRatio ?? 0)),
    })),
  };
};

const readLocalConfig = async (): Promise<CoverageConfig | null> => {
  try {
    const body = await readFile(LOCAL_PATH, "utf8");
    return normalizeConfig(JSON.parse(body) as CoverageConfig);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    console.warn("[coverage] Local config unreadable:", err.message ?? error);
    return null;
  }
};

const writeLocalConfig = async (config: CoverageConfig): Promise<void> => {
  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await writeFile(LOCAL_PATH, JSON.stringify(config, null, 2), "utf8");
};

export type CoverageLoadResult = {
  config: CoverageConfig;
  meta: CoverageStorageMeta;
};

export const loadCoverageConfig = async (): Promise<CoverageLoadResult> => {
  const now = Date.now();
  if (memoryCache && now - memoryCache.loadedAt < CACHE_TTL_MS) {
    return { config: memoryCache.config, meta: memoryCache.meta };
  }

  const bucket = getIntakeBucket();
  let config: CoverageConfig;
  let meta: CoverageStorageMeta;

  try {
    if (isLocalCoverageStorage()) {
      const local = await readLocalConfig();
      if (local) {
        config = local;
        meta = { source: "local" };
      } else {
        config = { ...DEFAULT_COVERAGE_CONFIG };
        meta = {
          source: "defaults",
          warning: "Using default regions — no local coverage file found.",
        };
      }
    } else {
      const raw = await readS3ObjectJson<CoverageConfig>(COVERAGE_CONFIG_KEY);
      if (raw?.regions?.length) {
        config = normalizeConfig(raw);
        meta = { source: "s3" };
      } else if (raw === null) {
        config = { ...DEFAULT_COVERAGE_CONFIG };
        meta = {
          source: "defaults",
          warning: bucket
            ? `No saved coverage at s3://${bucket}/${COVERAGE_CONFIG_KEY} — using defaults. Save once to create it.`
            : "TASKS_S3_BUCKET / INTAKE_S3_BUCKET is not set — using default regions.",
        };
      } else {
        config = normalizeConfig(raw);
        meta = {
          source: "defaults",
          warning: "Saved coverage file was empty or invalid — using default regions.",
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[coverage] load failed:", message);
    config = { ...DEFAULT_COVERAGE_CONFIG };
    meta = {
      source: "defaults",
      warning: `Could not read coverage from storage (${message}). Using default regions.`,
    };
  }

  memoryCache = { config, meta, loadedAt: now };
  return { config, meta };
};

/** Back-compat helper — never throws. */
export const getCoverageConfig = async (): Promise<CoverageConfig> => {
  const { config } = await loadCoverageConfig();
  return config;
};

export const saveCoverageConfig = async (
  config: CoverageConfig,
  updatedBy?: string
): Promise<CoverageConfig> => {
  const next: CoverageConfig = normalizeConfig({
    ...config,
    version: (config.version ?? 1) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });

  if (isLocalCoverageStorage()) {
    await writeLocalConfig(next);
  } else {
    await writeS3ObjectJson(COVERAGE_CONFIG_KEY, next);
  }

  const meta: CoverageStorageMeta = {
    source: isLocalCoverageStorage() ? "local" : "s3",
  };
  memoryCache = { config: next, meta, loadedAt: Date.now() };
  return next;
};

export const invalidateCoverageCache = (): void => {
  memoryCache = null;
};
