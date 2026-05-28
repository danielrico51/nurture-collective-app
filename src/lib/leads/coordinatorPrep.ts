import {
  MATERNAL_STAGE_LABELS,
  SUPPORT_INTEREST_LABELS,
} from "@/content/intake";
import type { ConversationSession } from "@/types/conversation";
import type { LeadConversationPrep, LeadRecord } from "@/types/lead";
import type { MaternalStage, SupportInterest } from "@/types/intake";

const truncate = (text: string, max = 280) =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

const formatInterests = (interests: string[]): string => {
  if (!interests.length) return "Not specified yet";
  return interests
    .map(
      (interest) =>
        SUPPORT_INTEREST_LABELS[interest as SupportInterest] ?? interest
    )
    .join(", ");
};

export const buildCoordinatorPrepFromSession = (
  lead: LeadRecord,
  session: ConversationSession | null
): LeadConversationPrep => {
  const profile = session?.extractedProfile;
  const stageLabel = lead.maternalStage
    ? MATERNAL_STAGE_LABELS[lead.maternalStage as MaternalStage] ?? lead.maternalStage
    : profile?.maternalStage
      ? MATERNAL_STAGE_LABELS[profile.maternalStage] ?? profile.maternalStage
      : null;

  const interests = lead.supportInterests.length
    ? lead.supportInterests
    : profile?.supportInterests ?? [];

  const challenges =
    lead.challengesSummary.trim() ||
    profile?.challengesFreeText?.trim() ||
    "";

  const emotional =
    profile?.emotionalState ??
    profile?.emotionalSignals?.[profile.emotionalSignals.length - 1] ??
    null;

  const bullets: string[] = [];

  if (stageLabel) bullets.push(`Journey stage: ${stageLabel}`);
  bullets.push(`Services of interest: ${formatInterests(interests)}`);
  if (challenges) bullets.push(`Main challenges: ${truncate(challenges, 200)}`);
  if (emotional && emotional !== "neutral") {
    bullets.push(`Emotional tone: ${emotional.replace(/_/g, " ")}`);
  }
  bullets.push(`Intake profile: ${lead.completionScore}% complete`);
  if (lead.isGuest) bullets.push("Signed in as guest — may need account follow-up");

  const name = lead.name || "This family";
  const stagePhrase = stageLabel ? ` who is ${stageLabel.toLowerCase()}` : "";
  const interestPhrase = interests.length
    ? ` They are interested in ${formatInterests(interests).toLowerCase()}.`
    : " They have not narrowed down services yet.";
  const challengePhrase = challenges
    ? ` Key concerns: ${truncate(challenges, 160)}`
    : "";
  const emotionalPhrase =
    emotional && emotional !== "neutral"
      ? ` Emotional signals suggest ${emotional.replace(/_/g, " ")}.`
      : "";

  const narrativeSummary = `${name}${stagePhrase}.${interestPhrase}${challengePhrase}${emotionalPhrase}`.trim();

  const recentMessages: LeadConversationPrep["recentMessages"] = (session?.messages ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: truncate(message.content, 500),
      timestamp: message.timestamp,
    }));

  return {
    sessionId: session?.id ?? lead.conversationSessionId,
    sessionStatus: session?.status ?? null,
    messageCount: session?.messages.length ?? 0,
    updatedAt: session?.updatedAt ?? lead.updatedAt,
    narrativeSummary,
    summaryBullets: bullets,
    emotionalState: emotional,
    recentMessages,
  };
};
