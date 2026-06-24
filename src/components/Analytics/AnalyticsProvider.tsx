"use client";

import {
  analyticsConfig,
  buildGa4Config,
  isGa4Enabled,
} from "@/config/analytics";
import { captureMarketingAttribution } from "@/lib/analytics/attribution";
import { initGtag, syncAttributionToGa4 } from "@/lib/analytics/gtag";
import { trackPageView } from "@/lib/analytics/track";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ga4ConfigJson = JSON.stringify(buildGa4Config());

const AnalyticsScripts = () => {
  if (!isGa4Enabled()) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.ga4MeasurementId}`}
        strategy="afterInteractive"
        onLoad={initGtag}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${analyticsConfig.ga4MeasurementId}', ${ga4ConfigJson});
        `}
      </Script>
    </>
  );
};

/** Loads GA4, captures attribution, and tracks SPA page views. */
const AnalyticsProvider = () => {
  const pathname = usePathname();

  useEffect(() => {
    const attribution = captureMarketingAttribution();
    syncAttributionToGa4(attribution ?? undefined);
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return <AnalyticsScripts />;
};

export default AnalyticsProvider;
