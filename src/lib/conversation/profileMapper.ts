import type {
  ChallengeOption,
  IntakeDraft,
  MaternalStage,
  SupportInterest,
} from "@/types/intake";
import type { ExtractedMaternalProfile } from "@/types/conversation";

const STAGE_ALIASES: Record<string, MaternalStage> = {
  ttc: "trying-to-conceive",
  "trying to conceive": "trying-to-conceive",
  pregnant: "pregnant",
  postpartum: "newly-postpartum",
  "newly postpartum": "newly-postpartum",
  infant: "infant-care",
  toddler: "toddler",
  "multiple children": "multiple-children",
};

const INTEREST_ALIASES: Record<string, SupportInterest> = {
  "birth doula": "birth-doula",
  "postpartum doula": "postpartum-doula",
  lactation: "lactation",
  sleep: "sleep-consulting",
  "pelvic floor": "pelvic-floor",
  "mental wellness": "mental-wellness",
  therapy: "mental-wellness",
  nutrition: "nutrition",
  "childbirth education": "childbirth-education",
  pediatric: "pediatric-guidance",
};

const CHALLENGE_ALIASES: Record<string, ChallengeOption> = {
  sleep: "sleep-deprivation",
  breastfeeding: "breastfeeding-pain",
  anxiety: "anxiety",
  overwhelm: "overwhelm",
  recovery: "recovery",
  scheduling: "scheduling-help",
  support: "lack-of-support",
  work: "returning-to-work",
};

export const computeMissingFields = (
  profile: ExtractedMaternalProfile
): string[] => {
  const missing: string[] = [];
  if (!profile.maternalStage) missing.push("maternalStage");
  if (!profile.supportInterests.length) missing.push("supportInterests");
  if (!profile.challenges.length && !profile.challengesFreeText.trim()) {
    missing.push("challenges");
  }
  if (!profile.name.trim()) missing.push("name");
  if (!profile.phone.trim()) missing.push("phone");
  return missing;
};

export const computeCompletionScore = (
  profile: ExtractedMaternalProfile
): number => {
  const weights = [
    profile.maternalStage ? 20 : 0,
    profile.supportInterests.length ? 20 : 0,
    profile.challenges.length || profile.challengesFreeText ? 15 : 0,
    profile.locationZip ? 10 : 0,
    profile.name ? 15 : 0,
    profile.phone ? 15 : 0,
    profile.emotionalState ? 5 : 0,
  ];
  return Math.min(100, weights.reduce((sum, value) => sum + value, 0));
};

export const mergeExtractedProfile = (
  current: ExtractedMaternalProfile,
  patch: Partial<ExtractedMaternalProfile>
): ExtractedMaternalProfile => {
  const merged: ExtractedMaternalProfile = {
    ...current,
    ...patch,
    supportInterests: patch.supportInterests ?? current.supportInterests,
    challenges: patch.challenges ?? current.challenges,
    emotionalSignals: patch.emotionalSignals ?? current.emotionalSignals,
    preferredSchedule: {
      ...current.preferredSchedule,
      ...(patch.preferredSchedule ?? {}),
    },
  };
  merged.missingFields = computeMissingFields(merged);
  merged.completionScore = computeCompletionScore(merged);
  merged.readyToComplete =
    merged.missingFields.length === 0 ||
    (merged.completionScore >= 80 &&
      Boolean(merged.maternalStage) &&
      merged.supportInterests.length > 0 &&
      Boolean(merged.name) &&
      Boolean(merged.phone));
  return merged;
};

export const extractedProfileToIntakeDraft = (
  profile: ExtractedMaternalProfile
): IntakeDraft => ({
  name: profile.name,
  email: profile.email,
  phone: profile.phone,
  smsConsent: profile.smsConsent,
  maternalStage: profile.maternalStage,
  dueDate: profile.dueDate,
  trimester: profile.trimester,
  postpartumWeeks: profile.postpartumWeeks,
  postpartumMonths: profile.postpartumMonths,
  supportInterests: profile.supportInterests,
  challenges: profile.challenges,
  challengesFreeText: profile.challengesFreeText,
  preferredSchedule: profile.preferredSchedule,
  locationZip: profile.locationZip,
  insuranceProvider: profile.insuranceProvider,
  insuranceInterested: profile.insuranceInterested,
  budgetPreference: profile.budgetPreference,
});

export const parseQuickReplyToPatch = (
  reply: string,
  profile: ExtractedMaternalProfile
): Partial<ExtractedMaternalProfile> => {
  const lower = reply.toLowerCase().trim();
  const patch: Partial<ExtractedMaternalProfile> = {};

  if (STAGE_ALIASES[lower]) patch.maternalStage = STAGE_ALIASES[lower];
  if (lower === "pregnant") patch.maternalStage = "pregnant";
  if (lower.includes("postpartum")) patch.maternalStage = "newly-postpartum";
  if (lower.includes("trying")) patch.maternalStage = "trying-to-conceive";

  for (const [alias, interest] of Object.entries(INTEREST_ALIASES)) {
    if (lower.includes(alias)) {
      patch.supportInterests = Array.from(
        new Set([...profile.supportInterests, interest])
      );
    }
  }

  for (const [alias, challenge] of Object.entries(CHALLENGE_ALIASES)) {
    if (lower.includes(alias)) {
      patch.challenges = Array.from(
        new Set([...profile.challenges, challenge])
      );
    }
  }

  const zipMatch = reply.match(/\b\d{5}\b/);
  if (zipMatch) patch.locationZip = zipMatch[0];

  const phoneMatch = reply.match(/\+?\d[\d\s()-]{8,}/);
  if (phoneMatch) patch.phone = phoneMatch[0].replace(/\s/g, "");

  return patch;
};
