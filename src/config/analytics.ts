const readEnv = (key: string): string => process.env[key]?.trim() ?? "";

const isTruthy = (value: string): boolean =>
  value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";

export const analyticsConfig = {
  ga4MeasurementId: readEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID"),
  ga4DebugMode: isTruthy(readEnv("NEXT_PUBLIC_GA4_DEBUG_MODE")),
};

export const isGa4Enabled = (): boolean =>
  Boolean(analyticsConfig.ga4MeasurementId);

/** gtag config shared by the inline script and runtime init. */
export const buildGa4Config = (): Record<string, boolean | string> => ({
  send_page_view: false,
  allow_google_signals: true,
  allow_ad_personalization_signals: true,
  ...(analyticsConfig.ga4DebugMode ? { debug_mode: true } : {}),
});

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
