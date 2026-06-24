const readEnv = (key: string): string => process.env[key]?.trim() ?? "";

export const analyticsConfig = {
  ga4MeasurementId: readEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID"),
  plausibleDomain: readEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN"),
  plausibleScriptSrc:
    readEnv("NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC") ||
    "https://plausible.io/js/script.js",
};

export const isGa4Enabled = (): boolean =>
  Boolean(analyticsConfig.ga4MeasurementId);

export const isPlausibleEnabled = (): boolean =>
  Boolean(analyticsConfig.plausibleDomain);

export const isAnalyticsEnabled = (): boolean =>
  isGa4Enabled() || isPlausibleEnabled();

/** Internal app areas excluded from page-view tracking. */
export const ANALYTICS_EXCLUDED_PATH_PREFIXES = [
  "/admin",
  "/management",
  "/apps",
  "/dashboard",
  "/account",
  "/invoice",
  "/oauth",
] as const;

export const isAnalyticsExcludedPath = (path: string): boolean =>
  ANALYTICS_EXCLUDED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
