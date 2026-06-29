import BookingEmbed from "@/components/Common/BookingEmbed";
import MarketingSection from "@/components/Common/MarketingSection";
import SectionTitle from "@/components/Common/SectionTitle";
import JsonLd from "@/components/Seo/JsonLd";
import ServicesAccordionRow from "@/components/Services/ServicesAccordionRow";
import ServicesCtaBanner from "@/components/Services/ServicesCtaBanner";
import ServicesHero from "@/components/Services/ServicesHero";
import ServicesJumpNav from "@/components/Services/ServicesJumpNav";
import ServicesLandingCard from "@/components/Services/ServicesLandingCard";
import ServicesOrphanCardShell from "@/components/Services/ServicesOrphanCardShell";
import {
  MARKETING_CREAM,
  MARKETING_OAK_SURFACE,
  marketingPageShell,
} from "@/config/marketingDesign";
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

export default async function ServicesPage() {
  const blogPosts = await fetchPublishedBlogPosts();
  const serviceRows = chunkServices(publishedCoreServices);

  return (
    <div className={marketingPageShell}>
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildServicesPageJsonLd(publishedCoreServices),
        ]}
      />
      <ServicesHero />

      <section
        className="py-12 sm:py-14"
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
          <SectionTitle
            title="Care for every stage of motherhood"
            subtitle="From birth planning through the fourth trimester — explore what we offer and request the support that fits your family."
            titleClassName="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl"
          />
          </div>

          <div className="mt-10">
            <ServicesJumpNav services={publishedCoreServices} />
          </div>

          <div className="mt-8 space-y-4">
            {serviceRows.map((row, rowIndex) => (
              <ServicesAccordionRow
                key={`service-row-${rowIndex}`}
                centerSingle={row.length === 1}
              >
                {row.map((service) => {
                  const cardData = buildServiceCardData(
                    service.slug,
                    blogPosts,
                  );

                  if (row.length === 1) {
                    return (
                      <ServicesOrphanCardShell
                        key={service.slug}
                        service={service}
                        detail={cardData.detail}
                        researchPoints={cardData.researchPoints}
                        sources={cardData.sources}
                        relatedPosts={cardData.relatedPosts}
                      />
                    );
                  }

                  return (
                    <ServicesLandingCard
                      key={service.slug}
                      layout="accordion"
                      service={service}
                      detail={cardData.detail}
                      researchPoints={cardData.researchPoints}
                      sources={cardData.sources}
                      relatedPosts={cardData.relatedPosts}
                    />
                  );
                })}
              </ServicesAccordionRow>
            ))}
          </div>
        </div>
      </section>

      <MarketingSection
        waves="both"
        footerClearance
        waveTopFill={MARKETING_OAK_SURFACE}
        waveBottomFill={MARKETING_CREAM}
        className="bg-nurture-lilac pb-0"
      >
        <ServicesCtaBanner />
        <BookingEmbed className="!py-12 sm:!py-14" />
      </MarketingSection>
    </div>
  );
}
