import {
  analyticsConfig,
  buildGa4Config,
  isGa4Enabled,
} from "@/config/analytics";
import {
  attributionToEventParams,
  readMarketingAttribution,
  resolveLeadSource,
  type MarketingAttribution,
} from "@/lib/analytics/attribution";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const initGtag = (): void => {
  if (typeof window === "undefined" || !isGa4Enabled()) return;

  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
  }

  window.gtag("js", new Date());
  window.gtag("config", analyticsConfig.ga4MeasurementId, buildGa4Config());
};

export const syncAttributionToGa4 = (
  attribution: MarketingAttribution = readMarketingAttribution()
): void => {
  if (typeof window === "undefined" || !isGa4Enabled() || !window.gtag) return;

  const userProperties: Record<string, string> = {
    lead_source: resolveLeadSource(attribution),
  };

  if (attribution.landing_page) {
    userProperties.first_touch_landing_page = attribution.landing_page;
  }
  if (attribution.utm_campaign) {
    userProperties.first_touch_campaign = attribution.utm_campaign;
  }
  if (attribution.utm_source) {
    userProperties.first_touch_source = attribution.utm_source;
  }

  window.gtag("set", "user_properties", userProperties);
};

const pageContext = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  return {
    page_location: window.location.href,
    page_referrer: document.referrer || "",
  };
};

export const sendGtagEvent = (
  eventName: string,
  params: Record<string, string | number | boolean> = {}
): void => {
  if (typeof window === "undefined" || !isGa4Enabled() || !window.gtag) return;

  window.gtag("event", eventName, {
    ...pageContext(),
    ...attributionToEventParams(readMarketingAttribution()),
    ...params,
  });
};

export const sendGtagPageView = (
  path: string,
  params: Record<string, string> = {}
): void => {
  if (typeof window === "undefined" || !isGa4Enabled() || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_title: document.title,
    ...pageContext(),
    ...params,
  });
};
