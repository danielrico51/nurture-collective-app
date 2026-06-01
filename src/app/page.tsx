import CallToAction from "@/components/Home/CallToAction";
import JoinTeamSection from "@/components/Home/JoinTeamSection";
import ServiceStatsSection from "@/components/Home/ServiceStatsSection";
import TeamBylineBanner from "@/components/Home/TeamBylineBanner";
import FaqList from "@/components/Common/FaqList";
import Hero from "@/components/Home/Hero";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import GoogleReviewsSection from "@/components/Reviews/GoogleReviewsSection";
import { momFaqs, momHowItWorks } from "@/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Nesting Place | Maternal Wellness & Postpartum Support",
  description:
    "The Nesting Place — birth doula, postpartum, lactation, and newborn support with real people guiding you every step of the way.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TeamBylineBanner />
      <ServiceStatsSection />
      <GoogleReviewsSection className="bg-nurture-sage/5" />
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
