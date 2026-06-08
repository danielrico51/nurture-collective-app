import type { ReactNode } from "react";
import type { ServiceSlug } from "@/content/site";

interface ServiceIllustrationProps {
  slug: ServiceSlug;
  className?: string;
}

// Muted maternity palette tuned to the mockup illustrations.
const skin = "#E6C0AE";
const skinShade = "#D9AE9B";
const hair = "#6E5848";
const hairDark = "#574436";
const sage = "#A9C3A6";
const sageDeep = "#8AAA88";
const lavender = "#B8A9C9";
const lavenderDeep = "#9E8DB6";
const cream = "#FBF6EF";
const swaddle = "#EBDCEF";
const blobFill = "#E7E1EE";

/** Soft irregular backdrop blob like the reference mockup. */
const Blob = () => (
  <path
    d="M48 78c-6-26 14-50 44-54 26-3 52 8 60 30 7 19 1 42-14 56-16 15-44 20-66 13C53 117 53 98 48 78Z"
    fill={blobFill}
    opacity="0.7"
  />
);

const FloorShadow = () => (
  <ellipse cx="100" cy="150" rx="56" ry="9" fill={lavender} opacity="0.25" />
);

const illustrations: Record<ServiceSlug, ReactNode> = {
  // Pregnant woman seated in lotus pose, hands cradling belly.
  "birth-doula": (
    <>
      <Blob />
      <FloorShadow />
      {/* hair */}
      <path
        d="M82 50c-4 8-5 18-3 27 0 0 8 6 21 6s21-6 21-6c2-9 1-19-3-27-4-9-12-14-18-14s-14 5-18 14Z"
        fill={hair}
      />
      {/* head */}
      <circle cx="100" cy="52" r="15" fill={skin} />
      <path d="M82 50c4-9 12-14 18-14s14 5 18 14c-3-3-9-6-18-6s-15 3-18 6Z" fill={hairDark} />
      {/* torso + belly */}
      <path
        d="M78 92c0-13 10-22 22-22s22 9 22 22c0 14-3 24-8 30H86c-5-6-8-16-8-30Z"
        fill={sage}
      />
      <ellipse cx="100" cy="104" rx="20" ry="17" fill={sageDeep} opacity="0.55" />
      {/* crossed legs */}
      <path
        d="M66 132c8-8 22-10 34-10s26 2 34 10c4 4 2 10-4 11l-30 3-30-3c-6-1-8-7-4-11Z"
        fill={lavender}
      />
      <path d="M88 124c8 4 16 4 24 0" stroke={lavenderDeep} strokeWidth="2.5" fill="none" />
      {/* arms on belly */}
      <path d="M80 96c-3 9-2 18 6 24" stroke={skinShade} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M120 96c3 9 2 18-6 24" stroke={skinShade} strokeWidth="6" strokeLinecap="round" fill="none" />
    </>
  ),
  // Parent cradling a swaddled newborn, looking down.
  "overnight-newborn": (
    <>
      <Blob />
      <FloorShadow />
      <path
        d="M84 46c-5 8-6 20-3 30 0 0 7 5 19 5s19-5 19-5c3-10 2-22-3-30-4-8-11-12-16-12s-12 4-16 12Z"
        fill={hair}
      />
      <circle cx="102" cy="50" r="14" fill={skin} />
      {/* torso leaning */}
      <path
        d="M74 86c2-12 13-20 26-20 12 0 22 7 25 18 3 14 1 30-4 40H82c-6-12-10-26-8-38Z"
        fill={sage}
      />
      {/* cradling arm */}
      <path
        d="M70 96c-4 10-2 22 10 28l34 6c8 1 12-9 5-14-10-8-24-14-38-22-5-3-9-2-11 2Z"
        fill={skin}
        opacity="0.95"
      />
      {/* swaddled baby */}
      <ellipse cx="96" cy="112" rx="22" ry="13" fill={swaddle} transform="rotate(-12 96 112)" />
      <circle cx="80" cy="106" r="8" fill={skin} />
      <path d="M76 103c2-3 6-3 8 0" stroke={hairDark} strokeWidth="1.5" fill="none" />
      {/* moon accent */}
      <path d="M150 50a10 10 0 1 1-9-13 8 8 0 0 0 9 13Z" fill={lavender} opacity="0.75" />
    </>
  ),
  // Couple holding a baby together (postpartum support).
  "postpartum-care": (
    <>
      <Blob />
      <FloorShadow />
      {/* left parent */}
      <path d="M58 56c-4 7-5 16-3 24 0 0 6 4 15 4s15-4 15-4c2-8 1-17-3-24-3-7-9-11-12-11s-9 4-12 11Z" fill={hair} />
      <circle cx="70" cy="60" r="12" fill={skin} />
      <path d="M48 96c1-11 10-18 22-18s21 7 22 18c2 13 0 24-4 32H52c-5-8-7-19-4-32Z" fill={lavender} />
      {/* right parent */}
      <path d="M114 54c-4 7-5 17-3 25 0 0 7 4 16 4s16-4 16-4c2-8 1-18-3-25-3-7-10-11-13-11s-10 4-13 11Z" fill={hairDark} />
      <circle cx="127" cy="58" r="13" fill={skin} />
      <path d="M104 96c1-12 11-19 23-19s22 7 23 19c2 12 0 22-4 30h-38c-5-8-6-18-4-30Z" fill={sage} />
      {/* baby cradled between */}
      <ellipse cx="100" cy="112" rx="17" ry="11" fill={swaddle} />
      <circle cx="100" cy="106" r="8" fill={skin} />
      <path d="M96 104c2-3 6-3 8 0" stroke={hairDark} strokeWidth="1.5" fill="none" />
      {/* arms meeting */}
      <path d="M84 100c5 6 12 9 16 9s11-3 16-9" stroke={skinShade} strokeWidth="5" strokeLinecap="round" fill="none" />
    </>
  ),
  // Seated woman nursing baby to chest (lactation).
  lactation: (
    <>
      <Blob />
      <FloorShadow />
      <path d="M83 48c-4 8-5 18-3 27 0 0 7 5 20 5s20-5 20-5c2-9 1-19-3-27-4-8-12-13-17-13s-13 5-17 13Z" fill={hair} />
      <circle cx="100" cy="52" r="14" fill={skin} />
      <path
        d="M74 92c0-13 11-22 26-22s26 9 26 22c0 16-4 28-9 36H83c-5-8-9-20-9-36Z"
        fill={sage}
      />
      {/* cradling arms forming a nest */}
      <path d="M72 98c-3 11 0 22 11 28h34c11-6 14-17 11-28-3 6-12 12-28 12s-25-6-28-12Z" fill={sageDeep} opacity="0.5" />
      {/* baby */}
      <ellipse cx="92" cy="112" rx="18" ry="11" fill={swaddle} transform="rotate(-8 92 112)" />
      <circle cx="80" cy="108" r="7" fill={skin} />
      <path d="M104 100c4 4 5 9 3 14" stroke={skinShade} strokeWidth="5" strokeLinecap="round" fill="none" />
    </>
  ),
  // Person on a massage table with therapist hands (prenatal).
  "prenatal-massage": (
    <>
      <Blob />
      <ellipse cx="100" cy="150" rx="60" ry="8" fill={lavender} opacity="0.25" />
      {/* table */}
      <rect x="36" y="112" width="128" height="16" rx="8" fill={lavender} opacity="0.55" />
      <rect x="46" y="128" width="6" height="16" rx="3" fill={lavenderDeep} opacity="0.7" />
      <rect x="148" y="128" width="6" height="16" rx="3" fill={lavenderDeep} opacity="0.7" />
      {/* draped client lying down */}
      <path d="M58 110c10-8 70-8 84 0 4 2 4 6 0 8-26 4-58 4-84 0-4-2-4-6 0-8Z" fill={swaddle} />
      <ellipse cx="148" cy="100" rx="14" ry="11" fill={skin} />
      <path d="M150 92c5-3 11-2 14 2-4 1-10 2-14 0Z" fill={hair} />
      {/* therapist torso + hands */}
      <path d="M40 96c0-12 9-20 19-20s19 8 19 20c0 8-2 14-5 18H45c-3-4-5-10-5-18Z" fill={sage} />
      <circle cx="59" cy="66" r="11" fill={skin} />
      <path d="M44 60c2-7 8-11 15-11s13 4 15 11c-4-3-9-5-15-5s-11 2-15 5Z" fill={hairDark} />
      <path d="M70 104c8-3 16-5 26-5" stroke={skinShade} strokeWidth="6" strokeLinecap="round" fill="none" />
    </>
  ),
  // Person on a massage table — recovery toned (postpartum massage).
  "postpartum-massage": (
    <>
      <Blob />
      <ellipse cx="100" cy="150" rx="60" ry="8" fill={sage} opacity="0.25" />
      <rect x="36" y="112" width="128" height="16" rx="8" fill={sage} opacity="0.5" />
      <rect x="46" y="128" width="6" height="16" rx="3" fill={sageDeep} opacity="0.7" />
      <rect x="148" y="128" width="6" height="16" rx="3" fill={sageDeep} opacity="0.7" />
      <path d="M58 110c10-8 70-8 84 0 4 2 4 6 0 8-26 4-58 4-84 0-4-2-4-6 0-8Z" fill={swaddle} />
      <ellipse cx="148" cy="100" rx="14" ry="11" fill={skin} />
      <path d="M150 92c5-3 11-2 14 2-4 1-10 2-14 0Z" fill={hair} />
      <path d="M40 96c0-12 9-20 19-20s19 8 19 20c0 8-2 14-5 18H45c-3-4-5-10-5-18Z" fill={lavender} />
      <circle cx="59" cy="66" r="11" fill={skin} />
      <path d="M44 60c2-7 8-11 15-11s13 4 15 11c-4-3-9-5-15-5s-11 2-15 5Z" fill={hairDark} />
      <path d="M70 102c8-2 16-3 26-3" stroke={skinShade} strokeWidth="6" strokeLinecap="round" fill="none" />
    </>
  ),
  "birth-photography": (
    <>
      <Blob />
      <FloorShadow />
      <rect x="60" y="74" width="80" height="56" rx="10" fill={lavender} opacity="0.6" />
      <circle cx="100" cy="102" r="17" fill={cream} />
      <circle cx="100" cy="102" r="10" fill={sage} opacity="0.7" />
      <path d="M76 74l8-12h32l8 12" fill={lavenderDeep} opacity="0.8" />
      <circle cx="132" cy="86" r="4" fill={cream} />
    </>
  ),
  // Small seated class / circle (childbirth education).
  "childbirth-education": (
    <>
      <Blob />
      <FloorShadow />
      {/* three seated learners */}
      {[
        { x: 62, top: sage, h: hair },
        { x: 100, top: lavender, h: hairDark },
        { x: 138, top: sageDeep, h: hair },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={74} r="12" fill={skin} />
          <path
            d={`M${p.x - 13} 70c2-7 7-11 13-11s11 4 13 11c-4-3-8-5-13-5s-9 2-13 5Z`}
            fill={p.h}
          />
          <path
            d={`M${p.x - 16} 112c0-11 7-18 16-18s16 7 16 18c0 6-1 11-3 15H${p.x - 13}c-2-4-3-9-3-15Z`}
            fill={p.top}
          />
        </g>
      ))}
      {/* shared book/board */}
      <rect x="72" y="120" width="56" height="14" rx="4" fill={cream} stroke={lavenderDeep} strokeOpacity="0.4" />
      <path d="M100 120v14" stroke={lavenderDeep} strokeWidth="1.5" opacity="0.5" />
    </>
  ),
};

const ServiceIllustration = ({
  slug,
  className = "h-36 w-full sm:h-40",
}: ServiceIllustrationProps) => (
  <svg
    viewBox="0 0 200 170"
    className={className}
    aria-hidden
    role="presentation"
  >
    <rect width="200" height="170" fill={cream} rx="12" />
    {illustrations[slug]}
  </svg>
);

export default ServiceIllustration;
