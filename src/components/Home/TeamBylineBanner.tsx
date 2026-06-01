import Link from "next/link";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const TeamBylineBanner = () => {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-nurture-sage px-8 py-14 text-center text-white sm:px-16">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            {brands.nestingPlace.byline}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            Nurture Collective connects families with trusted Maternal Wellness
            support — with a dedicated coordinator by your side from your first
            call through every stage of motherhood.
          </p>
          <div className="mt-8">
            <Link
              href={buildCareStartHref()}
              className="inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-cream"
            >
              Request support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamBylineBanner;
