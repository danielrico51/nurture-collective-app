import { analyticsConfig, isGa4Enabled } from "@/config/analytics";

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
  window.gtag("config", analyticsConfig.ga4MeasurementId, {
    send_page_view: false,
  });
};

export const sendGtagEvent = (
  eventName: string,
  params: Record<string, string | number | boolean> = {}
): void => {
  if (typeof window === "undefined" || !isGa4Enabled() || !window.gtag) return;
  window.gtag("event", eventName, params);
};

export const sendGtagPageView = (
  path: string,
  params: Record<string, string> = {}
): void => {
  if (typeof window === "undefined" || !isGa4Enabled() || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    ...params,
  });
};
