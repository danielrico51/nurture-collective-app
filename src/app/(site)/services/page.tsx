import BookingEmbed from "@/components/Common/BookingEmbed";
import MarketingSection from "@/components/Common/MarketingSection";
import JsonLd from "@/components/Seo/JsonLd";
import ServicesCtaBanner from "@/components/Services/ServicesCtaBanner";
import ServicesHero from "@/components/Services/ServicesHero";
import ServicesJumpNav from "@/components/Services/ServicesJumpNav";
import ServicesLandingCard from "@/components/Services/ServicesLandingCard";
import { MARKETING_CREAM } from "@/config/marketingDesign";
import { buildPageMetadata } from "@/config/seo";
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

const orphanCardClass =
  "mx-auto w-full max-w-[15rem] sm:max-w-[17rem] md:col-start-2 md:mx-0 md:max-w-none";

export default async function ServicesPage() {
  const blogPosts = await fetchPublishedBlogPosts();
  const serviceRows = chunkServices(publishedCoreServices);

  return (
    <div className="overflow-x-hidden bg-nurture-cream">
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildServicesPageJsonLd(publishedCoreServices),
        ]}
      />
      <ServicesHero />

      <section className="bg-nurture-cream py-12 sm:py-14">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
              Care for every stage of motherhood
            </h2>
            <p className="mt-3 text-lg text-nurture-charcoal/70">
              From birth planning through the fourth trimester — explore what we
              offer and request the support that fits your family.
            </p>
          </div>

          <div className="mt-10">
            <ServicesJumpNav services={publishedCoreServices} />
          </div>

          <div className="mt-8 space-y-4">
            {serviceRows.map((row, rowIndex) => {
              const isSingleOrphan = row.length === 1;

              return (
                <div
                  key={`service-row-${rowIndex}`}
                  className="grid gap-4 md:grid-cols-3"
                >
                  {row.map((service) => {
                    const cardData = buildServiceCardData(
                      service.slug,
                      blogPosts,
                    );

                    return (
                      <div
                        key={service.slug}
                        className={isSingleOrphan ? orphanCardClass : undefined}
                      >
                        <ServicesLandingCard
                          service={service}
                          detail={cardData.detail}
                          researchPoints={cardData.researchPoints}
                          sources={cardData.sources}
                          relatedPosts={cardData.relatedPosts}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingSection
        waves="top"
        waveTopFill={MARKETING_CREAM}
        className="bg-white pb-0"
      >
        <ServicesCtaBanner />
        <BookingEmbed className="!py-12 sm:!py-14" />
      </MarketingSection>
    </div>
  );
}
