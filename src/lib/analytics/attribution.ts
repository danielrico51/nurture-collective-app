export const MARKETING_ATTRIBUTION_STORAGE_KEY = "nc_marketing_attribution";

export interface MarketingAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  referrer?: string;
  landing_page?: string;
  captured_at?: string;
}

type SearchParamsLike = {
  get(name: string): string | null;
};

const ATTRIBUTION_PARAM_NAMES = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
] as const;

const readParam = (
  params: SearchParamsLike,
  name: (typeof ATTRIBUTION_PARAM_NAMES)[number]
): string | undefined => {
  const value = params.get(name)?.trim();
  return value || undefined;
};

export const parseMarketingAttributionFromSearch = (
  search: string
): Partial<MarketingAttribution> => {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  if (!normalized) return {};

  const params = new URLSearchParams(normalized);
  const parsed: Partial<MarketingAttribution> = {};

  for (const name of ATTRIBUTION_PARAM_NAMES) {
    const value = readParam(params, name);
    if (value) parsed[name] = value;
  }

  return parsed;
};

export const mergeMarketingAttribution = (
  existing: MarketingAttribution | null,
  incoming: Partial<MarketingAttribution>,
  landingPage?: string
): MarketingAttribution | null => {
  const hasIncoming = Object.keys(incoming).length > 0;
  if (!existing && !hasIncoming && !landingPage) return null;

  const merged: MarketingAttribution = { ...(existing ?? {}) };

  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string" && value) {
      merged[key as keyof MarketingAttribution] = value;
    }
  }

  if (!merged.landing_page && landingPage) {
    merged.landing_page = landingPage;
  }

  if (!merged.captured_at && (hasIncoming || landingPage)) {
    merged.captured_at = new Date().toISOString();
  }

  if (!merged.referrer && typeof document !== "undefined") {
    const referrer = document.referrer?.trim();
    if (referrer) merged.referrer = referrer;
  }

  return merged;
};

export const readStoredMarketingAttribution = (): MarketingAttribution | null => {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(MARKETING_ATTRIBUTION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MarketingAttribution;
  } catch {
    return null;
  }
};

export const storeMarketingAttribution = (
  attribution: MarketingAttribution
): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    MARKETING_ATTRIBUTION_STORAGE_KEY,
    JSON.stringify(attribution)
  );
};

export const captureMarketingAttribution = (
  search?: string,
  landingPage?: string
): MarketingAttribution | null => {
  if (typeof window === "undefined") return null;

  const incoming = parseMarketingAttributionFromSearch(
    search ?? window.location.search
  );
  const existing = readStoredMarketingAttribution();
  const merged = mergeMarketingAttribution(
    existing,
    incoming,
    landingPage ?? window.location.pathname
  );

  if (merged) {
    storeMarketingAttribution(merged);
  }

  return merged;
};

export const readMarketingAttribution = (): MarketingAttribution => {
  return readStoredMarketingAttribution() ?? {};
};

export const resolveLeadSource = (
  attribution: MarketingAttribution = readMarketingAttribution()
): string => {
  if (attribution.gclid) return "google_ads";
  if (attribution.msclkid) return "microsoft_ads";

  const utmSource = attribution.utm_source?.toLowerCase();
  const utmMedium = attribution.utm_medium?.toLowerCase();

  if (utmSource === "google_business") return "google_business";
  if (utmMedium === "cpc" || utmMedium === "ppc" || utmMedium === "paid") {
    if (utmSource?.includes("google")) return "google_ads";
    if (utmSource?.includes("facebook") || utmSource?.includes("meta")) {
      return "meta_ads";
    }
    return "paid";
  }

  if (utmSource) return utmSource;

  const referrer = attribution.referrer?.toLowerCase() ?? "";
  if (!referrer) return "direct";
  if (referrer.includes("google.")) return "organic_google";
  if (referrer.includes("facebook.") || referrer.includes("instagram.")) {
    return "social";
  }
  return "referral";
};

export const attributionToEventParams = (
  attribution: MarketingAttribution = readMarketingAttribution()
): Record<string, string> => {
  const params: Record<string, string> = {
    lead_source: resolveLeadSource(attribution),
  };

  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "msclkid",
    "landing_page",
  ] as const) {
    const value = attribution[key];
    if (value) params[key] = value;
  }

  return params;
};
