import ContactOptions from "@/components/Common/ContactOptions";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";
import Link from "next/link";

const CallToAction = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-nurture-sage px-8 py-16 text-center text-white sm:px-16">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            {brands.nestingPlace.byline}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            Nurture Collective connects families with trusted maternal wellness
            support — expanding region by region, with a personal care coordinator
            by your side.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={buildCareStartHref()}
              className="inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-cream"
            >
              Request support
            </Link>
            <Link
              href="/for-moms"
              className="inline-block rounded-full border border-white/40 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore for moms
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
