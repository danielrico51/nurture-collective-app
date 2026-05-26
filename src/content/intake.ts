import type {
  BudgetPreference,
  ChallengeOption,
  MaternalStage,
  SupportInterest,
} from "@/types/intake";

export const MATERNAL_STAGES: {
  value: MaternalStage;
  label: string;
  description: string;
}[] = [
  {
    value: "trying-to-conceive",
    label: "Trying to conceive",
    description: "Planning and preparing for pregnancy",
  },
  {
    value: "pregnant",
    label: "Pregnant",
    description: "Expecting and preparing for birth",
  },
  {
    value: "newly-postpartum",
    label: "Newly postpartum",
    description: "In the first weeks and months after birth",
  },
  {
    value: "infant-care",
    label: "Infant support",
    description: "Navigating life with a baby",
  },
  {
    value: "toddler",
    label: "Toddler stage",
    description: "Supporting a growing little one",
  },
  {
    value: "multiple-children",
    label: "Multiple children",
    description: "Balancing support across your family",
  },
];

export const SUPPORT_INTERESTS: {
  value: SupportInterest;
  label: string;
  description: string;
}[] = [
  {
    value: "birth-doula",
    label: "Birth doula",
    description: "Labor and birth support",
  },
  {
    value: "postpartum-doula",
    label: "Postpartum doula",
    description: "Hands-on recovery and newborn help",
  },
  {
    value: "lactation",
    label: "Lactation support",
    description: "Breastfeeding and feeding guidance",
  },
  {
    value: "sleep-consulting",
    label: "Sleep consulting",
    description: "Gentle sleep strategies for your family",
  },
  {
    value: "pelvic-floor",
    label: "Pelvic floor therapy",
    description: "Recovery and core wellness",
  },
  {
    value: "mental-wellness",
    label: "Mental wellness",
    description: "Emotional support and counseling",
  },
  {
    value: "nutrition",
    label: "Nutrition",
    description: "Nourishment through every stage",
  },
  {
    value: "childbirth-education",
    label: "Childbirth education",
    description: "Classes and birth preparation",
  },
  {
    value: "pediatric-guidance",
    label: "Pediatric guidance",
    description: "Navigating infant and child health questions",
  },
  {
    value: "general-support",
    label: "General support",
    description: "Not sure yet — help me figure it out",
  },
];

export const CHALLENGE_OPTIONS: {
  value: ChallengeOption;
  label: string;
}[] = [
  { value: "sleep-deprivation", label: "Sleep deprivation" },
  { value: "breastfeeding-pain", label: "Breastfeeding pain" },
  { value: "anxiety", label: "Anxiety" },
  { value: "overwhelm", label: "Overwhelm" },
  { value: "recovery", label: "Physical recovery" },
  { value: "scheduling-help", label: "Scheduling help" },
  { value: "lack-of-support", label: "Lack of support" },
  { value: "returning-to-work", label: "Returning to work" },
];

export const SCHEDULE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const SCHEDULE_TIMES = [
  "Early morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Flexible",
] as const;

export const BUDGET_OPTIONS: {
  value: BudgetPreference;
  label: string;
  description: string;
}[] = [
  {
    value: "insurance-first",
    label: "Insurance first",
    description: "Prefer services covered by my plan",
  },
  {
    value: "flexible",
    label: "Flexible",
    description: "Open to a mix of options",
  },
  {
    value: "budget-conscious",
    label: "Budget-conscious",
    description: "Looking for affordable support",
  },
  {
    value: "premium",
    label: "Premium support",
    description: "Prioritizing the best available support",
  },
];

export const SUPPORT_INTEREST_LABELS: Record<SupportInterest, string> =
  Object.fromEntries(
    SUPPORT_INTERESTS.map((item) => [item.value, item.label])
  ) as Record<SupportInterest, string>;

export const MATERNAL_STAGE_LABELS: Record<MaternalStage, string> =
  Object.fromEntries(
    MATERNAL_STAGES.map((item) => [item.value, item.label])
  ) as Record<MaternalStage, string>;

export const DEFAULT_TIMEZONE =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/New_York";

export const INTAKE_DRAFT_STORAGE_KEY = "nurture-intake-draft";
