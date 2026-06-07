import type {
  ChallengeOption,
  IntakeDraft,
  MaternalStage,
  SupportInterest,
} from "@/types/intake";
import type {
  ConversationMessage,
  ExtractedMaternalProfile,
} from "@/types/conversation";

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
  "postpartum care": "postpartum-doula",
  "overnight newborn": "overnight-newborn-care",
  "overnight care": "overnight-newborn-care",
  "newborn care": "overnight-newborn-care",
  "night nurse": "overnight-newborn-care",
  lactation: "lactation",
  "prenatal massage": "prenatal-massage",
  massage: "prenatal-massage",
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
  if (!profile.phone.trim() && !profile.email.trim()) {
    missing.push("contactInfo");
  }
  return missing;
};

export const hasContactInfo = (profile: ExtractedMaternalProfile): boolean =>
  Boolean(profile.phone.trim() || profile.email.trim());

/** Name + email are required to book an introductory call (phone optional). */
export const hasBookingContact = (profile: ExtractedMaternalProfile): boolean =>
  Boolean(profile.name.trim() && profile.email.trim());

const EMAIL_IN_TEXT_RE =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

const isExcludedNameReply = (content: string): boolean => {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) return true;
  if (STAGE_ALIASES[lower]) return true;
  if (/^(first|second|third) trimester$/i.test(trimmed)) return true;
  if (/^prefer not to share/i.test(lower)) return true;
  if (/^(yes|no|ok|okay|thanks|thank you|that's everything)$/i.test(trimmed)) {
    return true;
  }
  if (/\?/.test(trimmed)) return true;
  if (trimmed.length > 80) return true;

  for (const alias of Object.keys(INTEREST_ALIASES)) {
    if (lower.includes(alias)) return true;
  }
  for (const alias of Object.keys(CHALLENGE_ALIASES)) {
    if (lower.includes(alias)) return true;
  }

  return false;
};

/** Email must appear in a user message — not only in extracted/auth defaults. */
export const hasEmailProvidedInChat = (
  messages: Pick<ConversationMessage, "role" | "content">[]
): boolean =>
  messages.some(
    (message) =>
      message.role === "user" && EMAIL_IN_TEXT_RE.test(message.content)
  );

/** Name must be stated by the user — not inferred from auth or assistant text. */
export const hasNameProvidedInChat = (
  messages: Pick<ConversationMessage, "role" | "content">[],
  profile: ExtractedMaternalProfile
): boolean => {
  const name = profile.name.trim();
  if (!name) return false;

  return messages.some((message) => {
    if (message.role !== "user") return false;
    const content = message.content.trim();
    if (isExcludedNameReply(content)) return false;

    if (/(?:my name is|name is|i am|i'?m|call me)\s+/i.test(content)) {
      return true;
    }

    if (content.toLowerCase() === name.toLowerCase()) return true;

    const parts = name.split(/\s+/).filter(Boolean);
    if (
      parts.length <= 3 &&
      parts.every((part) =>
        new RegExp(
          `\\b${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "i"
        ).test(content)
      )
    ) {
      return true;
    }

    return false;
  });
};

export const hasCollectedBookingContactInChat = (
  messages: Pick<ConversationMessage, "role" | "content">[],
  profile: ExtractedMaternalProfile
): boolean =>
  hasBookingContact(profile) &&
  hasEmailProvidedInChat(messages) &&
  hasNameProvidedInChat(messages, profile);

/** Drop auth/account/extraction guesses until the user stated them in this chat. */
export const scrubUnverifiedContactFromProfile = (
  profile: ExtractedMaternalProfile,
  messages: Pick<ConversationMessage, "role" | "content">[]
): ExtractedMaternalProfile => {
  let next = profile;
  if (profile.name.trim() && !hasNameProvidedInChat(messages, profile)) {
    next = mergeExtractedProfile(next, { name: "" });
  }
  if (profile.email.trim() && !hasEmailProvidedInChat(messages)) {
    next = mergeExtractedProfile(next, { email: "" });
  }
  return next;
};

/** Profile snapshot safe to show the LLM (no unverified PII). */
export const profileForLlmContext = (
  profile: ExtractedMaternalProfile,
  messages: Pick<ConversationMessage, "role" | "content">[]
): ExtractedMaternalProfile => scrubUnverifiedContactFromProfile(profile, messages);

export const canOfferScheduling = (
  profile: ExtractedMaternalProfile,
  messages: Pick<ConversationMessage, "role" | "content">[] = []
): boolean => {
  const userMessageCount = messages.filter(
    (message) => message.role === "user"
  ).length;

  return (
    userMessageCount >= 3 &&
    Boolean(profile.maternalStage) &&
    profile.supportInterests.length > 0 &&
    hasCollectedBookingContactInChat(messages, profile)
  );
};

export const computeCompletionScore = (
  profile: ExtractedMaternalProfile
): number => {
  const hasContact = Boolean(profile.name.trim() && (profile.phone || profile.email));
  if (!hasContact) {
    const exploratory = [
      profile.maternalStage ? 10 : 0,
      profile.supportInterests.length ? 10 : 0,
      profile.locationZip ? 5 : 0,
    ];
    return Math.min(35, exploratory.reduce((sum, value) => sum + value, 0));
  }

  const weights = [
    profile.maternalStage ? 20 : 0,
    profile.supportInterests.length ? 20 : 0,
    profile.challenges.length || profile.challengesFreeText ? 15 : 0,
    profile.locationZip ? 10 : 0,
    profile.name ? 15 : 0,
    profile.phone || profile.email ? 15 : 0,
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
      hasContactInfo(merged));
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
  if (lower.includes("trying") && !lower.includes("prefer not")) {
    patch.maternalStage = "trying-to-conceive";
  }
  if (lower.includes("prefer not to share")) {
    patch.locationZip = profile.locationZip || "declined";
  }

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

  const phoneMatch = reply.match(
    /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}|\+?\d[\d\s()-]{8,}/
  );
  if (phoneMatch) patch.phone = phoneMatch[0].replace(/\s/g, "");

  const emailMatch = reply.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
  );
  if (emailMatch) patch.email = emailMatch[0];

  const nameFromPhrase = reply.match(
    /(?:my name is|name is|i am|i'?m|this is|call me)\s+(.+)/i
  );
  if (nameFromPhrase) {
    const candidate = nameFromPhrase[1]
      .replace(/\[.*?\]/g, "")
      .replace(/[.!?].*$/, "")
      .trim();
    if (candidate && !candidate.includes("@") && candidate.length >= 2) {
      patch.name = candidate.slice(0, 80);
    }
  } else if (
    !emailMatch &&
    !phoneMatch &&
    !zipMatch &&
    !patch.maternalStage &&
    !patch.supportInterests?.length
  ) {
    const trimmed = reply.trim();
    if (
      /^[A-Za-z][A-Za-z\s'-]{0,60}$/.test(trimmed) &&
      trimmed.split(/\s+/).length <= 4 &&
      trimmed.length >= 2
    ) {
      patch.name = trimmed;
    }
  }

  return patch;
};
