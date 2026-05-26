import { chatCompletionJson } from "@/lib/openai/client";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/conversation/prompts";
import {
  mergeExtractedProfile,
  parseQuickReplyToPatch,
} from "@/lib/conversation/profileMapper";
import type {
  ConversationMessage,
  ExtractedMaternalProfile,
  EmotionalSignal,
} from "@/types/conversation";
import type {
  BudgetPreference,
  ChallengeOption,
  MaternalStage,
  SupportInterest,
  Trimester,
} from "@/types/intake";

interface ExtractionPayload {
  maternalStage?: MaternalStage | null;
  dueDate?: string | null;
  trimester?: Trimester | null;
  postpartumWeeks?: number | null;
  postpartumMonths?: number | null;
  supportInterests?: SupportInterest[];
  challenges?: ChallengeOption[];
  challengesFreeText?: string;
  emotionalState?: EmotionalSignal | null;
  emotionalSignals?: EmotionalSignal[];
  insuranceProvider?: string;
  insuranceInterested?: boolean | null;
  budgetPreference?: BudgetPreference | null;
  locationZip?: string;
  preferredSchedule?: ExtractedMaternalProfile["preferredSchedule"];
  name?: string;
  email?: string;
  phone?: string;
  smsConsent?: boolean;
  quickReplies?: string[];
  readyToComplete?: boolean;
}

export const extractProfileFromConversation = async (
  messages: ConversationMessage[],
  current: ExtractedMaternalProfile
): Promise<{
  profile: ExtractedMaternalProfile;
  quickReplies: string[];
}> => {
  const transcript = messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  try {
    const result = await chatCompletionJson<ExtractionPayload>([
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Current profile JSON:\n${JSON.stringify(current)}\n\nConversation:\n${transcript}\n\nReturn JSON with fields to merge into profile plus quickReplies (2-4 short options for next user reply).`,
      },
    ]);

    const profile = mergeExtractedProfile(current, {
      maternalStage: result.maternalStage ?? current.maternalStage,
      dueDate: result.dueDate ?? current.dueDate,
      trimester: result.trimester ?? current.trimester,
      postpartumWeeks: result.postpartumWeeks ?? current.postpartumWeeks,
      postpartumMonths: result.postpartumMonths ?? current.postpartumMonths,
      supportInterests: result.supportInterests?.length
        ? result.supportInterests
        : current.supportInterests,
      challenges: result.challenges?.length
        ? result.challenges
        : current.challenges,
      challengesFreeText:
        result.challengesFreeText ?? current.challengesFreeText,
      emotionalState: result.emotionalState ?? current.emotionalState,
      emotionalSignals: result.emotionalSignals?.length
        ? result.emotionalSignals
        : current.emotionalSignals,
      insuranceProvider: result.insuranceProvider ?? current.insuranceProvider,
      insuranceInterested:
        result.insuranceInterested ?? current.insuranceInterested,
      budgetPreference: result.budgetPreference ?? current.budgetPreference,
      locationZip: result.locationZip ?? current.locationZip,
      preferredSchedule: result.preferredSchedule ?? current.preferredSchedule,
      name: result.name ?? current.name,
      email: result.email ?? current.email,
      phone: result.phone ?? current.phone,
      smsConsent: result.smsConsent ?? current.smsConsent,
      readyToComplete: result.readyToComplete ?? current.readyToComplete,
    });

    return {
      profile,
      quickReplies: result.quickReplies ?? [],
    };
  } catch {
    return { profile: current, quickReplies: [] };
  }
};

export const applyUserMessageHeuristics = (
  message: string,
  current: ExtractedMaternalProfile
): ExtractedMaternalProfile => {
  const patch = parseQuickReplyToPatch(message, current);
  let profile = mergeExtractedProfile(current, patch);

  if (!profile.challengesFreeText && message.length > 20) {
    profile = mergeExtractedProfile(profile, {
      challengesFreeText: [profile.challengesFreeText, message]
        .filter(Boolean)
        .join(" ")
        .trim()
        .slice(0, 2000),
    });
  }

  const emotionalKeywords: [RegExp, EmotionalSignal][] = [
    [/\b(overwhelm|overwhelmed|too much)\b/i, "overwhelm"],
    [/\b(anxious|anxiety|worried|panic)\b/i, "anxiety"],
    [/\b(alone|isolated|no support|lonely)\b/i, "isolation"],
    [/\b(exhausted|tired|no sleep|depleted)\b/i, "exhaustion"],
    [/\b(urgent|asap|right away|emergency)\b/i, "urgency"],
  ];

  for (const [pattern, signal] of emotionalKeywords) {
    if (pattern.test(message)) {
      profile = mergeExtractedProfile(profile, {
        emotionalState: signal,
        emotionalSignals: Array.from(
          new Set([...profile.emotionalSignals, signal])
        ),
      });
      break;
    }
  }

  return profile;
};
