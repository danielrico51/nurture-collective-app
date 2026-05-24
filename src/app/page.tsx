import CallToAction from "@/components/Home/CallToAction";
import Faq from "@/components/Home/Faq";
import Hero from "@/components/Home/Hero";
import HowItWorks from "@/components/Home/HowItWorks";
import ServicesPreview from "@/components/Home/ServicesPreview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Nurture Collective | Pre & Postpartum Mom Concierge",
  description:
    "Personalized pre- and postpartum concierge support for mothers — practical help, emotional care, and guidance through every stage.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <HowItWorks />
      <Faq />
      <CallToAction />
    </>
  );
}
