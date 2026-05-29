import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEFAULT_COVERAGE_CONFIG } from "@/lib/coverage/defaults";
import {
  getIntakeBucket,
  readS3ObjectJson,
  writeS3ObjectJson,
} from "@/lib/intake/s3Storage";
import type { CoverageConfig } from "@/types/coverage";

const COVERAGE_CONFIG_KEY = "platform/coverage/coverage-config.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "coverage", "coverage-config.json");

const isLocalCoverageStorage = (): boolean =>
  process.env.COVERAGE_USE_LOCAL_STORAGE === "true" ||
  (process.env.NODE_ENV === "development" && !getIntakeBucket());

let memoryCache: { config: CoverageConfig; loadedAt: number } | null = null;
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
    throw error;
  }
};

const writeLocalConfig = async (config: CoverageConfig): Promise<void> => {
  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await writeFile(LOCAL_PATH, JSON.stringify(config, null, 2), "utf8");
};

export const getCoverageConfig = async (): Promise<CoverageConfig> => {
  const now = Date.now();
  if (memoryCache && now - memoryCache.loadedAt < CACHE_TTL_MS) {
    return memoryCache.config;
  }

  let config: CoverageConfig;
  if (isLocalCoverageStorage()) {
    config = (await readLocalConfig()) ?? { ...DEFAULT_COVERAGE_CONFIG };
  } else {
    try {
      const raw = await readS3ObjectJson<CoverageConfig>(COVERAGE_CONFIG_KEY);
      config = normalizeConfig(raw);
    } catch (error) {
      console.warn(
        "[coverage] S3 read failed — using default regions:",
        error instanceof Error ? error.message : error
      );
      config = { ...DEFAULT_COVERAGE_CONFIG };
    }
  }

  memoryCache = { config, loadedAt: now };
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

  memoryCache = { config: next, loadedAt: Date.now() };
  return next;
};

export const invalidateCoverageCache = (): void => {
  memoryCache = null;
};
