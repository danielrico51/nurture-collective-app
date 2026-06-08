import BookingEmbed from "@/components/Common/BookingEmbed";
import JsonLd from "@/components/Seo/JsonLd";
import ServicesCtaBanner from "@/components/Services/ServicesCtaBanner";
import ServicesHero from "@/components/Services/ServicesHero";
import ServicesLandingCard from "@/components/Services/ServicesLandingCard";
import { buildPageMetadata } from "@/config/seo";
import { publishedCoreServices } from "@/content/site";
import type { ServiceSlug } from "@/content/site";
import { fetchPublishedBlogPosts } from "@/lib/blog/public";
import {
  buildOrganizationJsonLd,
  buildServicesPageJsonLd,
} from "@/lib/seo/jsonLd";
import { buildServiceCardData } from "@/lib/services/cardData";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Birth Doula, Postpartum & Lactation Services",
  description:
    "Explore birth doula support, overnight newborn care, postpartum support, lactation consulting, prenatal massage, and childbirth education from The Nesting Place across NJ, NY, CT, and PA.",
  path: "/services",
  keywords: [
    "birth doula services New Jersey",
    "overnight newborn support NY",
    "lactation consultant CT",
    "postpartum doula PA",
  ],
});

const FEATURED_SLUGS: ServiceSlug[] = [
  "birth-doula",
  "overnight-newborn",
  "postpartum-care",
];

export default async function ServicesPage() {
  const blogPosts = await fetchPublishedBlogPosts();
  const featured = publishedCoreServices.filter((service) =>
    FEATURED_SLUGS.includes(service.slug)
  );
  const additional = publishedCoreServices.filter(
    (service) => !FEATURED_SLUGS.includes(service.slug)
  );

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildServicesPageJsonLd(publishedCoreServices),
        ]}
      />
      <ServicesHero />

      <section className="relative -mt-8 pb-16 sm:-mt-10 sm:pb-20">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((service) => {
              const cardData = buildServiceCardData(service.slug, blogPosts);
              return (
                <ServicesLandingCard
                  key={service.slug}
                  service={service}
                  featured
                  detail={cardData.detail}
                  researchPoints={cardData.researchPoints}
                  sources={cardData.sources}
                  relatedPosts={cardData.relatedPosts}
                />
              );
            })}
          </div>

          {additional.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {additional.map((service) => {
                const cardData = buildServiceCardData(service.slug, blogPosts);
                return (
                  <ServicesLandingCard
                    key={service.slug}
                    service={service}
                    detail={cardData.detail}
                    researchPoints={cardData.researchPoints}
                    sources={cardData.sources}
                    relatedPosts={cardData.relatedPosts}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <ServicesCtaBanner />
      <BookingEmbed />
    </>
  );
}
