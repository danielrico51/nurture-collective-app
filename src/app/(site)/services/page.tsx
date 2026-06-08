import BookingEmbed from "@/components/Common/BookingEmbed";
import ServicesCtaBanner from "@/components/Services/ServicesCtaBanner";
import ServicesHero from "@/components/Services/ServicesHero";
import ServicesLandingCard from "@/components/Services/ServicesLandingCard";
import { publishedCoreServices } from "@/content/site";
import type { ServiceSlug } from "@/content/site";
import { fetchPublishedBlogPosts } from "@/lib/blog/public";
import { buildServiceCardData } from "@/lib/services/cardData";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | The Nesting Place",
  description:
    "Birth doula support, overnight newborn support, postpartum support, lactation support, and prenatal massage through The Nesting Place.",
};

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
