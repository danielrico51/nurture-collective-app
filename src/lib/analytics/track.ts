import { isAnalyticsExcludedPath } from "@/config/analytics";
import {
  attributionToEventParams,
  readMarketingAttribution,
} from "@/lib/analytics/attribution";
import { sendGtagEvent, sendGtagPageView } from "@/lib/analytics/gtag";

export type FormSubmissionAnalytics = {
  formName: string;
  service?: string;
  audience?: string;
  eventSlug?: string;
};

export type CallBookingAnalytics = {
  source: "intro_call_page" | "intake_chat";
};

const conversionParams = (
  extra: Record<string, string | number | boolean> = {}
): Record<string, string | number | boolean> => ({
  ...extra,
});

export const trackPageView = (path: string): void => {
  if (typeof window === "undefined" || isAnalyticsExcludedPath(path)) return;

  const attribution = attributionToEventParams(readMarketingAttribution());
  sendGtagPageView(path, attribution);
};

/** GA4 recommended lead event — import as a Google Ads conversion. */
export const trackFormSubmission = (params: FormSubmissionAnalytics): void => {
  sendGtagEvent(
    "generate_lead",
    conversionParams({
      form_name: params.formName,
      ...(params.service ? { service: params.service } : {}),
      ...(params.audience ? { audience: params.audience } : {}),
      ...(params.eventSlug ? { event_slug: params.eventSlug } : {}),
    })
  );
};

/** GA4 recommended schedule event — import as a Google Ads conversion. */
export const trackCallBooking = (params: CallBookingAnalytics): void => {
  sendGtagEvent(
    "schedule",
    conversionParams({
      method: params.source,
      booking_source: params.source,
    })
  );
};
