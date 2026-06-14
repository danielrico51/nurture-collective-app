import BookingEmbed from "@/components/Common/BookingEmbed";
import JsonLd from "@/components/Seo/JsonLd";
import ServicesCtaBanner from "@/components/Services/ServicesCtaBanner";
import ServicesDecor from "@/components/Services/ServicesDecor";
import ServicesHero from "@/components/Services/ServicesHero";
import ServicesJumpNav from "@/components/Services/ServicesJumpNav";
import ServicesLandingCard from "@/components/Services/ServicesLandingCard";
import { buildPageMetadata } from "@/config/seo";
import { servicesPageDecor } from "@/config/servicesDecor";
import { publishedCoreServices } from "@/content/site";
import type { CoreService } from "@/content/site";
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

const SERVICE_ROW_SIZE = 3;

const chunkServices = (services: CoreService[]): CoreService[][] => {
  const rows: CoreService[][] = [];
  for (let index = 0; index < services.length; index += SERVICE_ROW_SIZE) {
    rows.push(services.slice(index, index + SERVICE_ROW_SIZE));
  }
  return rows;
};

export default async function ServicesPage() {
  const blogPosts = await fetchPublishedBlogPosts();
  const serviceRows = chunkServices(publishedCoreServices);

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildServicesPageJsonLd(publishedCoreServices),
        ]}
      />
      <ServicesHero />

      <section className="relative -mt-8 overflow-hidden bg-gradient-to-b from-transparent via-nurture-rose-light/15 to-nurture-sage-light/10 pb-16 sm:-mt-10 sm:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: `url(${servicesPageDecor.patternTile})`,
            backgroundSize: "280px 280px",
            backgroundRepeat: "repeat",
          }}
        />
        <ServicesDecor src={servicesPageDecor.edgeLeft} placement="edge-left" />
        <ServicesDecor src={servicesPageDecor.edgeRight} placement="edge-right" />
        <ServicesDecor
          src={servicesPageDecor.cornerBottomRight}
          placement="corner-bottom-right"
          className="opacity-35"
        />
        <div className="relative z-[1] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <ServicesJumpNav services={publishedCoreServices} />

          <div className="mt-6 space-y-4">
            {serviceRows.map((row, rowIndex) => (
              <div
                key={`service-row-${rowIndex}`}
                className="grid gap-4 md:grid-cols-3"
              >
                {row.map((service) => {
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
            ))}
          </div>
        </div>
      </section>

      <ServicesCtaBanner />
      <BookingEmbed />
    </>
  );
}
