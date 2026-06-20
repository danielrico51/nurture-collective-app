import Link from "next/link";
import SectionWaveEdges from "@/components/Common/SectionWaveEdges";

const NURTURE_CREAM = "#FAF7F2";

const JoinTeamSection = () => {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-20 sm:pb-20 sm:pt-24">
      <SectionWaveEdges topOnly topFill={NURTURE_CREAM} />
      <div className="relative mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
          We&apos;re growing
        </p>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
          Interested in joining our team?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-nurture-charcoal/70">
          We&apos;re building a thoughtful provider network. If you share our
          commitment to family-centered support, we&apos;d love to hear from you.
        </p>
        <Link
          href="/for-providers"
          className="btn-primary-lg mt-6"
        >
          Learn about joining our team
        </Link>
      </div>
    </section>
  );
};

export default JoinTeamSection;
