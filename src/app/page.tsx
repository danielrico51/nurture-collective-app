import CallToAction from "@/components/Home/CallToAction";
import AudienceSplit from "@/components/Home/AudienceSplit";
import ConciergeVision from "@/components/Home/ConciergeVision";
import CoreServicesSection from "@/components/Home/CoreServicesSection";
import CoverageMap from "@/components/Common/CoverageMap";
import FaqList from "@/components/Common/FaqList";
import Hero from "@/components/Home/Hero";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import GoogleReviewsSection from "@/components/Reviews/GoogleReviewsSection";
import { momFaqs, momHowItWorks } from "@/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Nurture Collective | Maternal Concierge & Provider Marketplace",
  description:
    "AI-powered maternal concierge and provider marketplace — connecting moms with doulas, postpartum care, lactation support, and everyday help, region by region.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <AudienceSplit />
      <CoreServicesSection />
      <CoverageMap />
      <GoogleReviewsSection className="bg-nurture-sage/5" />
      <HowItWorksSteps
        title="How it works for moms"
        subtitle="From first inquiry to ongoing support."
        steps={momHowItWorks}
        className="bg-nurture-sage/5 py-20"
      />
      <ConciergeVision />
      <FaqList items={momFaqs} />
      <CallToAction />
    </>
  );
}
