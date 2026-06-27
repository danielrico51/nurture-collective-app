import CallToAction from "@/components/Home/CallToAction";
import JoinTeamSection from "@/components/Home/JoinTeamSection";
import ServiceStatsSection from "@/components/Home/ServiceStatsSection";
import FaqList from "@/components/Common/FaqList";
import Hero from "@/components/Home/Hero";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import GoogleReviews from "@/components/Reviews/GoogleReviews";
import JsonLd from "@/components/Seo/JsonLd";
import { MARKETING_CREAM, MARKETING_OAK_SURFACE } from "@/config/marketingDesign";
import { buildPageMetadata } from "@/config/seo";
import { momFaqs, momHowItWorks } from "@/content/site";
import {
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/jsonLd";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = buildPageMetadata({
  title: "Birth Doula & Postpartum Support in NJ, NY, CT & PA",
  description:
    "The Nesting Place offers birth doula support, overnight newborn care, postpartum help, lactation consulting, and prenatal massage for families in Northern New Jersey, New York, Connecticut, and Pennsylvania.",
  path: "/",
  keywords: [
    "birth doula NJ NY CT PA",
    "postpartum doula near me",
    "overnight newborn care tri-state",
    "maternal wellness Northern New Jersey",
  ],
});

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-nurture-cream">
      <JsonLd
        data={[
          buildWebSiteJsonLd(),
          buildOrganizationJsonLd(),
          buildLocalBusinessJsonLd(),
          buildFaqPageJsonLd(momFaqs),
        ]}
      />
      <Hero />
      <ServiceStatsSection />
      <HowItWorksSteps
        title="How it works for moms"
        subtitle="From first inquiry to ongoing support."
        steps={momHowItWorks}
        organicWaves
        waveTopFill={MARKETING_OAK_SURFACE}
        waveBottomFill={MARKETING_CREAM}
        className="bg-nurture-sage"
      />
      <GoogleReviews className="bg-nurture-cream" />
      <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 bg-[#f4f5f5]">
        <div className="home-banner-frame relative overflow-hidden">
          <Image
            src="/branding/bannerbaby2.jpg"
            alt="Newborn baby sleeping peacefully on a soft white blanket"
            width={8896}
            height={3653}
            sizes="100vw"
            quality={90}
            className="home-banner-image"
          />
        </div>
      </section>
      <FaqList items={momFaqs} />
      <CallToAction />
      <JoinTeamSection />
    </div>
  );
}