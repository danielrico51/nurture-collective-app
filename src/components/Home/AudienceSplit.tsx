import Link from "next/link";

const cardClassName =
  "group flex flex-col rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm transition hover:border-nurture-sage/40 hover:shadow-md";

const AudienceSplit = () => {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-nurture-charcoal">
            How can we help you today?
          </h2>
          <p className="mt-3 text-nurture-charcoal/70">
            Whether you&apos;re a mom seeking support or a provider ready to join
            our network, start here.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className={cardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
              For families
            </p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-nurture-charcoal">
              I&apos;m a mom
            </h3>
            <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
              Access doulas, postpartum support, lactation, and our growing
              concierge — everyday help for every stage of motherhood, wherever
              we&apos;re live in your region.
            </p>
            <Link
              href="/for-moms"
              className="mt-6 inline-block rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
            >
              Explore mom services
            </Link>
          </article>

          <article className={cardClassName}>
            <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
              For professionals
            </p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-nurture-charcoal">
              I&apos;m a service provider
            </h3>
            <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
              Join the Nurture Collective provider network. We&apos;re recruiting
              doulas, lactation consultants, newborn care specialists, and more
              as we expand market by market.
            </p>
            <Link
              href="/for-providers"
              className="mt-6 inline-block rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              Join as a provider
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
};

export default AudienceSplit;
