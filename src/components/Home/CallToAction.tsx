import ContactOptions from "@/components/Common/ContactOptions";
import { buildCareStartHref } from "@/config/carePaths";
import Link from "next/link";

const CallToAction = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-nurture-sage px-8 py-16 text-center text-white sm:px-16">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            Every mother deserves a team
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            Whether you&apos;re seeking care or offering your expertise, Nurture
            Collective connects families with trusted support — expanding region
            by region, powered by AI concierge.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={buildCareStartHref()}
                className="inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-cream"
              >
                Request care
              </Link>
              <Link
                href="/for-moms"
                className="inline-block rounded-full border border-white/40 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Explore for moms
              </Link>
              <Link
                href="/for-providers"
                className="inline-block rounded-full border border-white/40 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                I&apos;m a provider
              </Link>
          </div>
        </div>

        <div className="mt-12">
          <ContactOptions variant="intake" />
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
