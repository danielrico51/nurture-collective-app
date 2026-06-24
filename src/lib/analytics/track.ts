import { isAnalyticsExcludedPath } from "@/config/analytics";
import {
  attributionToEventParams,
  readMarketingAttribution,
} from "@/lib/analytics/attribution";
import { sendGtagEvent, sendGtagPageView } from "@/lib/analytics/gtag";
import { sendPlausibleEvent } from "@/lib/analytics/plausible";

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
  ...attributionToEventParams(readMarketingAttribution()),
  ...extra,
});

export const trackPageView = (path: string): void => {
  if (typeof window === "undefined" || isAnalyticsExcludedPath(path)) return;

  const attribution = attributionToEventParams(readMarketingAttribution());
  sendGtagPageView(path, attribution);
};

export const trackFormSubmission = (params: FormSubmissionAnalytics): void => {
  const eventParams = conversionParams({
    form_name: params.formName,
    ...(params.service ? { service: params.service } : {}),
    ...(params.audience ? { audience: params.audience } : {}),
    ...(params.eventSlug ? { event_slug: params.eventSlug } : {}),
  });

  sendGtagEvent("generate_lead", eventParams);
  sendPlausibleEvent("Form Submission", {
    form: params.formName,
    lead_source: String(eventParams.lead_source ?? "direct"),
    ...(params.service ? { service: params.service } : {}),
    ...(params.eventSlug ? { event: params.eventSlug } : {}),
  });
};

export const trackCallBooking = (params: CallBookingAnalytics): void => {
  const eventParams = conversionParams({
    booking_source: params.source,
  });

  sendGtagEvent("call_booking", eventParams);
  sendPlausibleEvent("Call Booking", {
    source: params.source,
    lead_source: String(eventParams.lead_source ?? "direct"),
  });
};
