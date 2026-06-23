"use client";

import MarketingSection from "@/components/Common/MarketingSection";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
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
    className={`flex flex-col rounded-2xl border border-nurture-lilac/25 bg-nurture-cream shadow-sm ${
      compact ? "p-6" : "p-8"
    }`}
  >
    {member.imageSrc ? (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full border border-nurture-lilac/25 bg-nurture-cream ${
          compact ? "h-16 w-16" : "h-[8.75rem] w-[8.75rem]"
        }`}
      >
        <Image
          src={member.imageSrc}
          alt={member.imageAlt ?? `${member.name}, ${member.role}`}
          fill
          sizes={compact ? "64px" : "140px"}
          className="object-cover object-center"
        />
      </div>
    ) : (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nurture-blush to-nurture-sage/30 font-serif font-semibold text-nurture-sage-dark ${
          compact ? "h-16 w-16 text-xl" : "h-[8.75rem] w-[8.75rem] text-3xl"
        }`}
        aria-hidden
      >
        {member.initials}
      </div>
    )}
    <h3 className="mt-5 font-serif text-xl font-semibold text-nurture-charcoal">
      {member.name}
    </h3>
    <p className="mt-1 text-sm font-medium text-nurture-grape">
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
  /** Section tint — grape uses light copy; lilac uses dark copy on brand lilac. */
  surface?: "light" | "grape" | "lilac";
}

const SURFACE_STYLES = {
  light: {
    heading: "text-nurture-charcoal",
    subtitle: "text-nurture-charcoal/70",
    link: "text-nurture-grape hover:underline",
  },
  grape: {
    heading: "text-nurture-cream",
    subtitle: "text-nurture-cream/80",
    link: "text-nurture-lilac hover:text-nurture-cream hover:underline",
  },
  lilac: {
    heading: "text-nurture-charcoal",
    subtitle: "text-nurture-charcoal/80",
    link: "text-nurture-grape hover:underline",
  },
} as const;

const SURFACE_BG: Record<NonNullable<TeamSectionProps["surface"]>, string> = {
  light: "",
  grape: "bg-nurture-grape",
  lilac: "bg-nurture-lilac",
};

export const TeamSection = ({
  title = "Meet the team behind your care",
  subtitle = "Real people who pick up the phone, answer your questions, and stay with you every step of the way.",
  members,
  showMeetLink = false,
  compact = false,
  className = "",
  organicWaves = false,
  surface = "light",
}: TeamSectionProps) => {
  const surfaceStyle = SURFACE_STYLES[surface];
  const sectionSurfaceClass = SURFACE_BG[surface];
  const inner = (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <ScrollRevealHeading
          variant="gentle"
          className={`font-serif text-3xl font-semibold sm:text-4xl ${surfaceStyle.heading}`}
        >
          {title}
        </ScrollRevealHeading>
        {subtitle ? (
          <p className={`mt-4 text-lg ${surfaceStyle.subtitle}`}>{subtitle}</p>
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
            className={`text-sm font-semibold ${surfaceStyle.link}`}
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
        className={`py-16 sm:py-20 ${sectionSurfaceClass} ${className}`}
      >
        {inner}
      </MarketingSection>
    );
  }

  return (
    <section className={`py-16 sm:py-20 ${sectionSurfaceClass} ${className}`}>
      {inner}
    </section>
  );
};

export default TeamMemberCard;
