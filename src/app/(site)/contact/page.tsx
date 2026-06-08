import ContactPageContent from "@/components/Contact/ContactPageContent";
import { buildPageMetadata } from "@/config/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact The Nesting Place | Birth Doula & Postpartum Support",
  description:
    "Contact The Nesting Place for birth doula support, overnight newborn care, postpartum help, and lactation consulting in Northern New Jersey, New York, Connecticut, and Pennsylvania.",
  path: "/contact",
  keywords: [
    "contact birth doula NJ",
    "postpartum support near me",
    "lactation consultant contact",
    "The Nesting Place contact",
  ],
});

export default function ContactPage() {
  return <ContactPageContent />;
}
