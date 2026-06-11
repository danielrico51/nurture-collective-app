import CallToAction from "@/components/Home/CallToAction";
import JoinTeamSection from "@/components/Home/JoinTeamSection";
import ServiceStatsSection from "@/components/Home/ServiceStatsSection";
import TeamBylineBanner from "@/components/Home/TeamBylineBanner";
import FaqList from "@/components/Common/FaqList";
import Hero from "@/components/Home/Hero";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import JsonLd from "@/components/Seo/JsonLd";
import { buildPageMetadata } from "@/config/seo";
import { momFaqs, momHowItWorks } from "@/content/site";
import {
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/seo/jsonLd";
import type { Metadata } from "next";

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
    <>
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildLocalBusinessJsonLd(),
          buildFaqPageJsonLd(momFaqs),
        ]}
      />
      <Hero />
      <TeamBylineBanner />
      <ServiceStatsSection />
      <HowItWorksSteps
        title="How it works for moms"
        subtitle="From first inquiry to ongoing support."
        steps={momHowItWorks}
        className="bg-nurture-sage/5 py-20"
      />
      <FaqList items={momFaqs} />
      <CallToAction />
      <JoinTeamSection />
    </>
  );
}
