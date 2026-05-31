export type Audience = "mom" | "provider";

export type CoverageStatus = "active" | "expanding" | "waitlist";

export interface CoverageRegion {
  id: string;
  name: string;
  status: CoverageStatus;
  services: string;
}

export type ServiceSlug =
  | "birth-doula"
  | "overnight-newborn"
  | "postpartum-care"
  | "lactation"
  | "prenatal-massage"
  | "postpartum-massage"
  | "birth-photography"
  | "childbirth-education";

export interface CoreService {
  slug: ServiceSlug;
  title: string;
  description: string;
  tag: string;
  benefit: string;
  availabilityNote?: string;
  status?: "available" | "coming-soon";
}

/** Public-facing name for the concierge experience — emphasizes real people, not AI. */
export const careCoordinator = {
  short: "Care coordinator",
  full: "Personal care coordinator",
  possessive: "your care coordinator",
  team: "your care team",
  platform: "personal care coordination",
  /** Guided intake / concierge chat UI */
  intake: {
    title: "Your support coordinator",
    messageLabel: "Your support coordinator",
    connecting: "Connecting with your support coordinator…",
    preparing: "Preparing your support coordinator…",
    inputLabel: "Message your support coordinator",
    typing: "Support coordinator is typing",
  },
} as const;

export const brands = {
  /** Primary public-facing brand (site, marketing, care delivery). */
  nestingPlace: {
    name: "The Nesting Place",
    shortName: "Nesting Place",
    /** Brand slogan — use as byline wherever Nesting Place is presented. */
    tagline: "Because Every Mother deserves a Team",
    byline: "Because Every Mother deserves a Team",
    /** Legal operator shown where entity attribution is required. */
    operatorLine: "by Nurture Collective LLC",
    logoSrc: "/branding/nesting-place-wordmark.png",
    wordmarkSrc: "/branding/nesting-place-wordmark.png",
    wordmarkCreamSrc: "/branding/nesting-place-wordmark-cream.png",
    markSrc: "/branding/nesting-place-baby-mark.png",
    serviceArea: "Northern New Jersey and surrounding areas",
    description:
      "An experienced maternal wellness and postpartum care practice offering birth doula support, overnight newborn care, postpartum care, lactation support, and prenatal massage — with real people guiding you from your first call through every stage of care.",
    phone: "(844) 926-2867",
    phoneE164: "+18449262867",
    email: "info@thenestingplacenj.com",
  },
  /** Legal entity operating The Nesting Place and the provider platform. */
  nurtureCollective: {
    name: "Nurture Collective LLC",
    shortName: "Nurture Collective",
    tagline: "Personal maternal support, every step of the way",
    description:
      "Nurture Collective LLC connects families with trusted birth doulas, postpartum support, lactation consultants, and wellness professionals through The Nesting Place and our growing provider network.",
  },
} as const;

export const socialLinks = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/thenestingplacenjny",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/thenestingplacenjny",
  },
  {
    id: "sms",
    label: "Text The Nesting Place",
    href: "sms:+18449262867",
  },
] as const;

/** Regions where in-person or local provider matching is live today. Add rows as you expand. */
export const coverageRegions: CoverageRegion[] = [
  {
    id: "northern-nj",
    name: "Northern New Jersey",
    status: "active",
    services:
      "Birth doula, postpartum support, overnight newborn support, lactation support, prenatal massage, childbirth education",
  },
  {
    id: "your-area",
    name: "Your area",
    status: "expanding",
    services:
      "Request support where you live — we're opening new regions and building our provider network market by market.",
  },
];

export const coverageStatusLabels: Record<CoverageStatus, string> = {
  active: "Active now",
  expanding: "Expanding",
  waitlist: "Join waitlist",
};

export const coverageIntro =
  "Service availability depends on your location. These are the regions where our team and provider network support families today.";

/** Core maternal wellness services offered through the network. */
export const coreServices: CoreService[] = [
  {
    slug: "birth-doula",
    title: "Birth doula support",
    description:
      "Experienced, evidence-based doula support for labor, birth planning, and continuous support through your birthing experience.",
    tag: "Doula support",
    benefit:
      "Feel calm and confident with a steady, compassionate presence from early labor through your baby's first moments.",
  },
  {
    slug: "overnight-newborn",
    title: "Overnight newborn support",
    description:
      "Skilled overnight support so you can rest and recover while experienced postpartum professionals support your newborn.",
    tag: "Newborn support",
    benefit:
      "Sleep and recover knowing your baby is in experienced, nurturing hands through the night.",
  },
  {
    slug: "postpartum-care",
    title: "Postpartum support",
    description:
      "Hands-on recovery support, feeding guidance, and practical help through the fourth trimester and beyond.",
    tag: "Postpartum",
    benefit:
      "Navigate the early weeks with emotional support, newborn care guidance, and practical help tailored to your family.",
  },
  {
    slug: "lactation",
    title: "Lactation support",
    description:
      "Specialized lactation guidance for breastfeeding, pumping, and combination feeding — tailored to your goals.",
    tag: "Lactation",
    benefit:
      "Get expert, judgment-free feeding support from certified lactation consultants who meet you where you are.",
  },
  {
    slug: "prenatal-massage",
    title: "Prenatal massage",
    description:
      "Therapeutic prenatal massage to ease discomfort, reduce stress, and support your body through pregnancy.",
    tag: "Wellness",
    benefit:
      "Relieve pregnancy discomfort and reconnect with your changing body in a calm, nurturing environment.",
    availabilityNote: "Available in Ridgewood and select Northern NJ locations.",
  },
  {
    slug: "postpartum-massage",
    title: "Postpartum massage",
    description:
      "Therapeutic massage to support recovery, ease tension, and nurture your body after birth.",
    tag: "Wellness",
    benefit:
      "Give yourself permission to rest and heal with bodywork designed for the postpartum period.",
    availabilityNote: "Currently available in Ridgewood only.",
  },
  {
    slug: "birth-photography",
    title: "Birth photography",
    description:
      "Capture the raw beauty of your birth story with a trusted photographer partner — preserving moments you'll treasure forever.",
    tag: "Photography",
    benefit:
      "Hold onto the first moments of meeting your baby with artful, respectful birth photography.",
    status: "coming-soon",
  },
  {
    slug: "childbirth-education",
    title: "Childbirth & newborn education",
    description:
      "Evidence-based classes to prepare you for labor, birth, and life with your newborn — so you feel informed and ready.",
    tag: "Education",
    benefit:
      "Walk into birth and early parenthood with knowledge, confidence, and a plan that reflects your values.",
  },
];

/** @deprecated Use coreServices — kept for any stale imports during refactor */
export const nestingPlaceServices = coreServices;

/** Expanded services coordinated through the personal care coordinator — rolling out over time. */
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
    title: "Full personal care coordination",
    description:
      "One dedicated coordinator, every service — personally matched support from pregnancy through every stage of motherhood.",
  },
] as const;

export const providerSpecialties = [
  { slug: "birth-doula", label: "Birth doula" },
  { slug: "postpartum-doula", label: "Postpartum doula" },
  { slug: "overnight-newborn", label: "Overnight newborn care specialist" },
  { slug: "lactation", label: "Lactation consultant (IBCLC or candidate)" },
  { slug: "massage", label: "Prenatal / postpartum massage therapist" },
  { slug: "photography", label: "Birth photographer" },
  { slug: "childcare", label: "Nanny or childcare provider" },
  { slug: "household", label: "Household / cleaning services" },
  { slug: "fitness", label: "Personal trainer or wellness coach" },
  { slug: "other", label: "Other maternal or family support" },
] as const;

export const momHowItWorks = [
  {
    step: "01",
    title: "Reach out — a real person answers",
    description:
      "Call, text, or send a message. Barb or a member of our team will personally guide you through what you need.",
  },
  {
    step: "02",
    title: "Complete your guided intake",
    description:
      "Share where you are in your journey at your own pace — we'll learn about your preferences, timeline, and the support you're looking for.",
  },
  {
    step: "03",
    title: "Design your custom care plan with Barb",
    description:
      "After intake, we'll schedule a follow-up call with Barb to walk through your needs together and design a personalized care plan for your family.",
  },
  {
    step: "04",
    title: "We're with you every step",
    description:
      "From pregnancy through postpartum, our team stays in direct contact — coordinating support so you never feel alone.",
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
      "We review your background, align on standards, and welcome you to The Nesting Place provider network.",
  },
  {
    step: "03",
    title: "Get matched with families",
    description:
      "Our team personally connects you with families who need your expertise — building lasting relationships, not automated lists.",
  },
] as const;

export const momFaqs = [
  {
    q: "Where is The Nesting Place available?",
    a: "We launch region by region. Check our coverage map for active areas. If your location is listed as expanding, submit a request — we use demand to prioritize new markets.",
  },
  {
    q: "What services are available today?",
    a: "In active regions we offer birth doula support, overnight newborn support, postpartum support, lactation support, prenatal massage, postpartum massage (Ridgewood), and childbirth education through our vetted provider network.",
  },
  {
    q: "Will I talk to a real person?",
    a: "Yes — always. Barb and our care team are in direct contact with every family. We use tools to stay organized, but you'll never feel like you're talking to a bot.",
  },
  {
    q: "Do you accept employer benefits like Carrot, Maven, or ProgenyHealth?",
    a: "Many of our clients use employer-sponsored family benefits through platforms such as Carrot, Maven Clinic, and ProgenyHealth. While we are not directly contracted with these programs, your plan may reimburse doula or postpartum care. Visit our Benefits page for a simple guide to each platform, or contact us — we're happy to help you navigate next steps.",
  },
  {
    q: "What is personal care coordination?",
    a: "As we grow, dedicated care coordinators help organize every service you need — from doula support to everyday help — with a real person guiding you every step of the way.",
  },
  {
    q: "Is this medical support?",
    a: "We provide wellness and support services. We do not replace care from your OB, midwife, or pediatrician. Always consult your healthcare provider for clinical concerns.",
  },
  {
    q: "What is the relationship between The Nesting Place and Nurture Collective LLC?",
    a: "The Nesting Place is our maternal wellness practice in Northern New Jersey — operated by Nurture Collective LLC, which also builds the provider network and care coordination platform as we expand region by region.",
  },
] as const;

export const providerFaqs = [
  {
    q: "Who should apply?",
    a: "We are actively recruiting experienced birth doulas, postpartum doulas, lactation consultants, newborn care specialists, massage therapists, birth photographers, and other maternal wellness providers.",
  },
  {
    q: "Why join The Nesting Place network?",
    a: "Partner with a growing practice that values personal relationships and dedicated care coordinators. Our team personally matches you with families — starting in our active regions and expanding nationally.",
  },
  {
    q: "What is the application process?",
    a: "Submit your interest through our provider form. Our team reviews credentials and experience, then schedules a conversation about fit, availability, and onboarding.",
  },
  {
    q: "Where do you operate?",
    a: "We onboard providers in our active coverage regions first, then expand based on family demand.",
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

export const humanTouchMessage =
  "In a market full of options, what sets us apart is the personal touch. Barb and our team are in direct contact with every family — guiding you, answering questions, and making sure you feel supported from your first call through every stage of care.";
