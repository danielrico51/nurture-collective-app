import type { EmployerBenefitPlatform } from "@/content/employerBenefitPlatforms";

interface EmployerBenefitPlatformCardProps {
  platform: EmployerBenefitPlatform;
}

const EmployerBenefitPlatformCard = ({
  platform,
}: EmployerBenefitPlatformCardProps) => (
  <article
    id={platform.id}
    className="flex flex-col rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h3 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        {platform.name}
      </h3>
      <a
        href={platform.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-nurture-sage-dark hover:underline"
      >
        Visit website →
      </a>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-nurture-charcoal/80">
      {platform.summary}
    </p>

    <div className="mt-6 space-y-4 text-sm leading-relaxed text-nurture-charcoal/75">
      <div>
        <p className="font-semibold text-nurture-charcoal">What employers offer</p>
        <p className="mt-1">{platform.employerFocus}</p>
      </div>
      <div>
        <p className="font-semibold text-nurture-charcoal">What members experience</p>
        <p className="mt-1">{platform.memberExperience}</p>
      </div>
      <div className="rounded-xl border border-nurture-sage/20 bg-nurture-sage/5 p-4">
        <p className="font-semibold text-nurture-sage-dark">
          Using benefits with The Nesting Place
        </p>
        <p className="mt-1">{platform.relevanceToNestingPlace}</p>
      </div>
    </div>
  </article>
);

export default EmployerBenefitPlatformCard;
