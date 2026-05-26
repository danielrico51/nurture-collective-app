import type {
  CareRecommendation,
  IntakeProfile,
  SupportInterest,
} from "@/types/intake";
import { isIntakeComplete } from "@/types/intake";

interface RecommendationRule {
  type: SupportInterest;
  priority: 1 | 2 | 3;
  reason: string;
  matches: (profile: IntakeProfile) => boolean;
}

const hasChallenge = (profile: IntakeProfile, ...values: string[]) =>
  profile.challenges.some((challenge) => values.includes(challenge));

const hasInterest = (profile: IntakeProfile, ...values: SupportInterest[]) =>
  profile.supportInterests.some((interest) => values.includes(interest));

const textMentions = (profile: IntakeProfile, ...terms: string[]) => {
  const text = profile.challengesFreeText.toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
};

const RULES: RecommendationRule[] = [
  {
    type: "lactation",
    priority: 1,
    reason:
      "You shared breastfeeding challenges — a lactation consultant can help with pain, latch, and feeding goals.",
    matches: (profile) =>
      hasChallenge(profile, "breastfeeding-pain") ||
      hasInterest(profile, "lactation") ||
      textMentions(profile, "breastfeed", "latch", "pumping"),
  },
  {
    type: "sleep-consulting",
    priority: 1,
    reason:
      "Sleep deprivation is tough — a sleep consultant can help your family find sustainable rest.",
    matches: (profile) =>
      hasChallenge(profile, "sleep-deprivation") ||
      hasInterest(profile, "sleep-consulting") ||
      textMentions(profile, "sleep", "nap", "night"),
  },
  {
    type: "mental-wellness",
    priority: 1,
    reason:
      "Anxiety and overwhelm are common in motherhood — mental wellness support can help you feel grounded.",
    matches: (profile) =>
      hasChallenge(profile, "anxiety", "overwhelm", "lack-of-support") ||
      hasInterest(profile, "mental-wellness") ||
      textMentions(profile, "anxious", "overwhelmed", "depressed", "stress"),
  },
  {
    type: "childbirth-education",
    priority: 1,
    reason:
      "You're approaching birth — childbirth education helps you feel prepared and confident.",
    matches: (profile) =>
      profile.maternalStage === "pregnant" &&
      (profile.trimester === "third" ||
        hasInterest(profile, "childbirth-education")),
  },
  {
    type: "birth-doula",
    priority: 2,
    reason:
      "A birth doula provides continuous support through labor, birth planning, and your birthing experience.",
    matches: (profile) =>
      profile.maternalStage === "pregnant" &&
      (hasInterest(profile, "birth-doula") || profile.trimester === "second"),
  },
  {
    type: "postpartum-doula",
    priority: 1,
    reason:
      "The postpartum period is intense — a postpartum doula offers hands-on recovery and newborn support.",
    matches: (profile) =>
      profile.maternalStage === "newly-postpartum" ||
      hasInterest(profile, "postpartum-doula") ||
      hasChallenge(profile, "recovery", "lack-of-support"),
  },
  {
    type: "pelvic-floor",
    priority: 2,
    reason:
      "Physical recovery matters — pelvic floor therapy supports healing after birth.",
    matches: (profile) =>
      hasInterest(profile, "pelvic-floor") ||
      hasChallenge(profile, "recovery") ||
      textMentions(profile, "pelvic", "incontinence", "core"),
  },
  {
    type: "nutrition",
    priority: 2,
    reason:
      "Nutrition support helps you nourish your body through conception, pregnancy, or postpartum.",
    matches: (profile) =>
      profile.maternalStage === "trying-to-conceive" ||
      hasInterest(profile, "nutrition") ||
      textMentions(profile, "nutrition", "diet", "meal"),
  },
  {
    type: "pediatric-guidance",
    priority: 2,
    reason:
      "Pediatric guidance helps you navigate questions about infant and child development with confidence.",
    matches: (profile) =>
      profile.maternalStage === "infant-care" ||
      profile.maternalStage === "toddler" ||
      profile.maternalStage === "multiple-children" ||
      hasInterest(profile, "pediatric-guidance"),
  },
  {
    type: "general-support",
    priority: 3,
    reason:
      "Your coordinator can help map the right mix of support for your unique journey.",
    matches: (profile) =>
      hasInterest(profile, "general-support") ||
      profile.supportInterests.length === 0,
  },
];

export const generateRecommendations = (
  profile: IntakeProfile
): CareRecommendation[] => {
  const now = new Date().toISOString();
  const matched = RULES.filter((rule) => rule.matches(profile));

  const seen = new Set<SupportInterest>();
  const recommendations: CareRecommendation[] = [];

  for (const rule of matched.sort((a, b) => a.priority - b.priority)) {
    if (seen.has(rule.type)) continue;
    seen.add(rule.type);
    recommendations.push({
      id: crypto.randomUUID(),
      userId: profile.userId,
      intakeProfileId: profile.id,
      recommendationType: rule.type,
      priorityLevel: rule.priority,
      recommendationReason: rule.reason,
      createdAt: now,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: crypto.randomUUID(),
      userId: profile.userId,
      intakeProfileId: profile.id,
      recommendationType: "general-support",
      priorityLevel: 2,
      recommendationReason:
        "Based on your intake, your coordinator will personalize a support plan for your journey.",
      createdAt: now,
    });
  }

  return recommendations.slice(0, 6);
};

export const buildCareChecklist = (
  profile: IntakeProfile | null,
  hasRecommendations: boolean
): { id: string; label: string; completed: boolean }[] => {
  const submitted = isIntakeComplete(profile?.intakeStatus);

  return [
    {
      id: "intake",
      label: "Complete your support intake",
      completed: submitted,
    },
    {
      id: "review",
      label: "Review your recommended services",
      completed: submitted && hasRecommendations,
    },
    {
      id: "schedule",
      label: "Schedule an intro call with your coordinator",
      completed: false,
    },
    {
      id: "profile",
      label: "Keep your profile and contact info up to date",
      completed: Boolean(profile?.phone),
    },
  ];
};
