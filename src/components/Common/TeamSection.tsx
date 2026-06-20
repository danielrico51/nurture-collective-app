import MarketingSection from "@/components/Common/MarketingSection";
import { MARKETING_CREAM } from "@/config/marketingDesign";
import type { TeamMemberProfile } from "@/content/team";
import Image from "next/image";
import Link from "next/link";

interface TeamMemberCardProps {
  member: TeamMemberProfile;
  compact?: boolean;
}

const TeamMemberCard = ({ member, compact = false }: TeamMemberCardProps) => (
  <article
    className={`flex flex-col rounded-2xl border border-nurture-sage/15 bg-white shadow-sm ${
      compact ? "p-6" : "p-8"
    }`}
  >
    {member.imageSrc ? (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full border border-nurture-sage/20 bg-nurture-cream ${
          compact ? "h-16 w-16" : "h-28 w-28"
        }`}
      >
        <Image
          src={member.imageSrc}
          alt={member.imageAlt ?? `${member.name}, ${member.role}`}
          fill
          sizes={compact ? "64px" : "112px"}
          className="object-cover object-center"
        />
      </div>
    ) : (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nurture-blush to-nurture-sage/30 font-serif font-semibold text-nurture-sage-dark ${
          compact ? "h-16 w-16 text-xl" : "h-28 w-28 text-3xl"
        }`}
        aria-hidden
      >
        {member.initials}
      </div>
    )}
    <h3 className="mt-5 font-serif text-xl font-semibold text-nurture-charcoal">
      {member.name}
    </h3>
    <p className="mt-1 text-sm font-medium text-nurture-sage-dark">
      {member.role}
    </p>
    <p
      className={`mt-3 text-justify text-nurture-charcoal/70 ${
        compact ? "line-clamp-4 text-sm" : "text-sm"
      }`}
    >
      {member.bio}
    </p>
  </article>
);

interface TeamSectionProps {
  title?: string;
  subtitle?: string;
  members: TeamMemberProfile[];
  showMeetLink?: boolean;
  compact?: boolean;
  className?: string;
  organicWaves?: boolean;
}

export const TeamSection = ({
  title = "Meet the team behind your care",
  subtitle = "Real people who pick up the phone, answer your questions, and stay with you every step of the way.",
  members,
  showMeetLink = false,
  compact = false,
  className = "",
  organicWaves = false,
}: TeamSectionProps) => {
  const inner = (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-4 text-lg text-nurture-charcoal/70">{subtitle}</p>
        ) : null}
      </div>
      <div
        className={`mt-12 grid gap-8 ${
          members.length >= 4
            ? "sm:grid-cols-2 xl:grid-cols-4"
            : members.length === 3
              ? "md:grid-cols-3"
              : "md:grid-cols-2 max-w-3xl mx-auto"
        }`}
      >
        {members.map((member) => (
          <TeamMemberCard key={member.id} member={member} compact={compact} />
        ))}
      </div>
      {showMeetLink ? (
        <div className="mt-10 text-center">
          <Link
            href="/about"
            className="text-sm font-semibold text-nurture-sage-dark hover:underline"
          >
            Learn more about our team →
          </Link>
        </div>
      ) : null}
    </div>
  );

  if (organicWaves) {
    return (
      <MarketingSection
        waves="both"
        waveTopFill={MARKETING_CREAM}
        waveBottomFill={MARKETING_CREAM}
        className={`py-16 sm:py-20 ${className}`}
      >
        {inner}
      </MarketingSection>
    );
  }

  return <section className={`py-16 sm:py-20 ${className}`}>{inner}</section>;
};

export default TeamMemberCard;
