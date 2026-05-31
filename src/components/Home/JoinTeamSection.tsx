import Link from "next/link";

const JoinTeamSection = () => {
  return (
    <section className="border-t border-nurture-sage/10 py-16">
      <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
          We&apos;re growing
        </p>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
          Interested in joining our team?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-nurture-charcoal/70">
          We&apos;re building our provider network region by region. If you
          share our commitment to thoughtful, family-centered support, we&apos;d
          love to hear from you.
        </p>
        <Link
          href="/for-providers"
          className="mt-6 inline-block rounded-full border border-nurture-sage px-8 py-3 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Learn about joining our team
        </Link>
      </div>
    </section>
  );
};

export default JoinTeamSection;
