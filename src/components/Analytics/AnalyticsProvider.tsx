"use client";

import { analyticsConfig, isAnalyticsEnabled } from "@/config/analytics";
import { captureMarketingAttribution } from "@/lib/analytics/attribution";
import { initGtag } from "@/lib/analytics/gtag";
import { trackPageView } from "@/lib/analytics/track";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const AnalyticsScripts = () => {
  if (!isAnalyticsEnabled()) return null;

  return (
    <>
      {analyticsConfig.ga4MeasurementId ? (
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
              gtag('config', '${analyticsConfig.ga4MeasurementId}', { send_page_view: false });
            `}
          </Script>
        </>
      ) : null}
      {analyticsConfig.plausibleDomain ? (
        <Script
          defer
          data-domain={analyticsConfig.plausibleDomain}
          src={analyticsConfig.plausibleScriptSrc}
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
};

/** Loads analytics scripts, captures attribution, and tracks SPA page views. */
const AnalyticsProvider = () => {
  const pathname = usePathname();

  useEffect(() => {
    captureMarketingAttribution();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return <AnalyticsScripts />;
};

export default AnalyticsProvider;
