export type Audience = "mom" | "provider";

export type CoverageStatus = "active" | "expanding" | "waitlist";

export interface CoverageRegion {
  id: string;
  name: string;
  status: CoverageStatus;
  services: string;
}

export const brands = {
  nurtureCollective: {
    name: "The Nurture Collective",
    shortName: "Nurture Collective",
    tagline: "AI-powered maternal concierge & provider marketplace",
    description:
      "Building the concierge platform that connects moms with trusted support — from doulas and postpartum support to everyday household help, coordinated in one place.",
  },
  nestingPlace: {
    name: "The Nesting Place",
    shortName: "Nesting Place",
    tagline: "Where happy families begin",
    logoSrc: "/branding/nesting-place-logo.png",
    markSrc: "/branding/nesting-place-mark.png",
    serviceArea: "Bergen County, Northern New Jersey, and surrounding areas",
    description:
      "An evidence-based maternal wellness and postpartum care practice offering experienced birth doula support, overnight newborn care, postpartum care, lactation support, and prenatal massage.",
  },
} as const;

/** Regions where in-person or local provider matching is live today. Add rows as you expand. */
export const coverageRegions: CoverageRegion[] = [
  {
    id: "northern-nj",
    name: "Northern New Jersey",
    status: "active",
    services:
      "Birth doula, postpartum support, overnight newborn support, lactation support, prenatal massage",
  },
  {
    id: "your-area",
    name: "Your area",
    status: "expanding",
    services:
      "Request support where you live — we’re opening new regions and building our provider network market by market.",
  },
];

export const coverageStatusLabels: Record<CoverageStatus, string> = {
  active: "Active now",
  expanding: "Expanding",
  waitlist: "Join waitlist",
};

export const coverageIntro =
  "Service availability depends on your location. We’re building a national concierge — these are the regions where support is available today.";

/** Core maternal wellness services offered through the network (not tied to a single brand). */
export const coreServices = [
  {
    slug: "birth-doula",
    title: "Birth doula support",
    description:
      "Experienced, evidence-based doula support for labor, birth planning, and continuous support through your birthing experience.",
    tag: "Doula support",
  },
  {
    slug: "overnight-newborn",
    title: "Overnight newborn support",
    description:
      "Skilled overnight support so you can rest and recover while experienced postpartum professionals support your newborn.",
    tag: "Newborn support",
  },
  {
    slug: "postpartum-care",
    title: "Postpartum support",
    description:
      "Hands-on recovery support, feeding guidance, and practical help through the fourth trimester and beyond.",
    tag: "Postpartum",
  },
  {
    slug: "lactation",
    title: "Lactation support",
    description:
      "Specialized lactation guidance for breastfeeding, pumping, and combination feeding — tailored to your goals.",
    tag: "Lactation",
  },
  {
    slug: "prenatal-massage",
    title: "Prenatal massage",
    description:
      "Therapeutic prenatal massage to ease discomfort, reduce stress, and support your body through pregnancy.",
    tag: "Wellness",
  },
] as const;

/** @deprecated Use coreServices — kept for any stale imports during refactor */
export const nestingPlaceServices = coreServices;

export const futureConciergeServices = [
  {
    title: "Household & cleaning",
    description: "Trusted help keeping your home calm while you focus on rest and recovery.",
  },
  {
    title: "Childcare & nanny support",
    description: "Vetted childcare options for siblings and flexible family coverage.",
  },
  {
    title: "Meals, errands & shopping",
    description: "Groceries, meal prep, and everyday tasks handled by people you trust.",
  },
  {
    title: "Fitness & wellness",
    description: "Personal trainers and wellness providers who understand the postpartum body.",
  },
  {
    title: "Full mom concierge",
    description:
      "One coordinator, every service — AI-matched support from pregnancy through every stage of motherhood.",
  },
] as const;

export const providerSpecialties = [
  { slug: "birth-doula", label: "Birth doula" },
  { slug: "postpartum-doula", label: "Postpartum doula" },
  { slug: "overnight-newborn", label: "Overnight newborn care specialist" },
  { slug: "lactation", label: "Lactation consultant (IBCLC or candidate)" },
  { slug: "massage", label: "Prenatal / postpartum massage therapist" },
  { slug: "childcare", label: "Nanny or childcare provider" },
  { slug: "household", label: "Household / cleaning services" },
  { slug: "fitness", label: "Personal trainer or wellness coach" },
  { slug: "other", label: "Other maternal or family support" },
] as const;

export const momHowItWorks = [
  {
    step: "01",
    title: "Tell us what you need",
    description:
      "Share where you are in your journey — pregnancy, newborn days, or navigating life with growing kids.",
  },
  {
    step: "02",
    title: "Get matched with support",
    description:
      "We connect you with vetted providers in your area through our growing concierge network.",
  },
  {
    step: "03",
    title: "Receive ongoing support",
    description:
      "From doula support to everyday help, your coordinator keeps support organized and personalized.",
  },
] as const;

export const providerHowItWorks = [
  {
    step: "01",
    title: "Apply to join",
    description:
      "Tell us about your credentials, experience, and the families you love serving.",
  },
  {
    step: "02",
    title: "Onboard with our team",
    description:
      "We review your background, align on standards, and welcome you to the Nurture Collective provider network.",
  },
  {
    step: "03",
    title: "Get matched with families",
    description:
      "As our concierge platform grows, AI-powered matching connects you with moms who need your expertise.",
  },
] as const;

export const momFaqs = [
  {
    q: "Where is Nurture Collective available?",
    a: "We launch region by region. Check our coverage map for active areas. If your location is listed as expanding, submit a request — we use demand to prioritize new markets.",
  },
  {
    q: "What services are available today?",
    a: "In active regions we offer birth doula support, overnight newborn support, postpartum support, lactation support, and prenatal massage through our vetted provider network.",
  },
  {
    q: "What is coming next?",
    a: "We're building a full mom concierge — matching you with cleaning, childcare, fitness, errands, and everyday support powered by AI, all coordinated in one place, in more locations over time.",
  },
  {
    q: "Is this medical support?",
    a: "We provide wellness and support services. We do not replace care from your OB, midwife, or pediatrician. Always consult your healthcare provider for clinical concerns.",
  },
  // The Nesting Place
  {
    q: "What is the relationship between Nurture Collective and The Nesting Place?",
    a: "The Nurture Collective owns and operates The Nesting Place — our maternal wellness practice in Northern New Jersey and the foundation for hands-on care in our first active region.",
  },
] as const;

export const providerFaqs = [
  {
    q: "Who should apply?",
    a: "We are actively recruiting experienced birth doulas, postpartum doulas, lactation consultants, newborn care specialists, massage therapists, and other maternal wellness providers. As the platform grows, we will onboard household, childcare, and lifestyle providers too.",
  },
  {
    q: "Why join Nurture Collective?",
    a: "Partner with a growing marketplace from day one. We're building the AI-powered concierge that will match you with families long term — starting in our active regions and expanding nationally.",
  },
  {
    q: "What is the application process?",
    a: "Submit your interest through our provider form. Our team reviews credentials and experience, then schedules a conversation about fit, availability, and onboarding.",
  },
  {
    q: "Where do you operate?",
    a: "We onboard providers in our active coverage regions first, then expand based on family demand. Remote or hybrid providers may qualify for platform roles as we scale.",
  },
] as const;

export const SERVICE_SLUGS: Record<string, string> = Object.fromEntries(
  coreServices.map((s) => [s.slug, s.title])
);

export const PROVIDER_SPECIALTY_SLUGS: Record<string, string> =
  Object.fromEntries(providerSpecialties.map((s) => [s.slug, s.label]));

export const audienceLabels: Record<Audience, string> = {
  mom: "I'm a mom",
  provider: "I'm a service provider",
};

export const isAudience = (value: string | null): value is Audience =>
  value === "mom" || value === "provider";
