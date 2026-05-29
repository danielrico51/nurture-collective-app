import {
  applyUserMessageHeuristics,
  extractProfileFromConversation,
} from "@/lib/conversation/extraction";
import {
  extractedProfileToIntakeDraft,
  mergeExtractedProfile,
} from "@/lib/conversation/profileMapper";
import { NESTING_PLACE_CONCIERGE_QUICK_REPLIES } from "@/content/nestingPlaceServices";
import { formatCoverageForConcierge } from "@/lib/coverage/concierge";
import { getCoverageConfig } from "@/lib/coverage/storage";
import { CONCIERGE_SYSTEM_PROMPT } from "@/lib/conversation/prompts";
import {
  detectSafetyEscalation,
  SAFETY_ESCALATION_REPLY,
} from "@/lib/conversation/safety";
import { userWantsToCompleteIntake } from "@/lib/conversation/completion";
import { isGuestLead } from "@/lib/leads/workflow";
import { syncLeadFromIntake } from "@/lib/leads/storage";
import { saveConversationSession } from "@/lib/conversation/storage";
import { isOpenAiConfigured, streamChatCompletion } from "@/lib/openai/client";
import { upsertProfileDraft, submitProfile } from "@/lib/intake/storage";
import type {
  ConversationMessage,
  ConversationSession,
  ExtractedMaternalProfile,
} from "@/types/conversation";
import type { SupportInterest } from "@/types/intake";
import { createEmptyExtractedProfile } from "@/types/conversation";

const WELCOME_MESSAGE =
  "Hi — I'm your support coordinator for The Nesting Place. I'm here to understand where you are in your journey and help connect you with the right support — birth doula care, postpartum help, lactation, overnight newborn care, or prenatal massage. There's no rush. To start, how far along are you in your motherhood journey?";

const buildWelcomeMessage = (userId: string, preselectedServiceTitle?: string) => {
  const base = preselectedServiceTitle
    ? `Hi — I'm your support coordinator for The Nesting Place. I see you're interested in ${preselectedServiceTitle.toLowerCase()} — I'll help connect you with the right support. To start, how far along are you in your motherhood journey?`
    : WELCOME_MESSAGE;
  return isGuestLead(userId) ? `${base}${GUEST_WELCOME_SUFFIX}` : base;
};

const DEFAULT_QUICK_REPLIES = [
  "Pregnant",
  "Newly postpartum",
  "Trying to conceive",
  "Infant care",
];

const FALLBACK_REPLIES: Record<string, string[]> = {
  start: DEFAULT_QUICK_REPLIES,
  maternalStage: [
    "Pregnant",
    "Newly postpartum",
    "Trying to conceive",
    "Infant care",
  ],
  supportInterests: NESTING_PLACE_CONCIERGE_QUICK_REPLIES,
  challenges: ["Sleep deprivation", "Anxiety or overwhelm", "Breastfeeding", "Recovery"],
  contact: ["Yes, SMS updates are OK", "Email only please"],
};

const GUEST_WELCOME_SUFFIX =
  " You're welcome to chat without an account — create a free member account anytime if you'd like to save this conversation and continue later.";

export interface PreselectedService {
  title: string;
  supportInterest: SupportInterest;
}

export const createConversationSession = async (
  userId: string,
  defaults: Partial<ExtractedMaternalProfile> = {},
  preselectedService?: PreselectedService
): Promise<ConversationSession> => {
  const now = new Date().toISOString();
  const initialInterests =
    defaults.supportInterests?.length
      ? defaults.supportInterests
      : preselectedService
        ? [preselectedService.supportInterest]
        : [];

  const extractedProfile = mergeExtractedProfile(createEmptyExtractedProfile(defaults), {
    ...(initialInterests.length ? { supportInterests: initialInterests } : {}),
  });

  const session: ConversationSession = {
    id: crypto.randomUUID(),
    userId,
    status: "active",
    messages: [],
    extractedProfile,
    quickReplies: DEFAULT_QUICK_REPLIES,
    safetyEscalation: false,
    createdAt: now,
    updatedAt: now,
  };

  const welcome: ConversationMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: buildWelcomeMessage(userId, preselectedService?.title),
    timestamp: now,
  };
  session.messages.push(welcome);
  return saveConversationSession(session);
};

const buildChatMessages = async (session: ConversationSession) => {
  const profile = session.extractedProfile;
  const needsContact =
    !profile.name.trim() || (!profile.phone.trim() && !profile.email.trim());

  const coverageConfig = await getCoverageConfig();
  const coveragePrompt = formatCoverageForConcierge(
    coverageConfig,
    profile.locationZip
  );

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: CONCIERGE_SYSTEM_PROMPT },
    { role: "system", content: coveragePrompt },
    {
      role: "system",
      content: `Current extracted profile (background): ${JSON.stringify(profile)}`,
    },
  ];

  if (needsContact) {
    messages.push({
      role: "system",
      content:
        "PRIORITY: Contact info is still missing for coordinator follow-up. Before completing intake, warmly collect the user's name and at least one contact method (email or phone). Explain that our care coordinator uses this to follow up with personalized recommendations.",
    });
  }

  if (profile.supportInterests.length > 0) {
    messages.push({
      role: "system",
      content:
        "The user already selected a service before starting this chat. Do not ask them to pick a service type again — focus on maternal stage, location, challenges, and contact details.",
    });
  }

  if (isGuestLead(session.userId)) {
    messages.push({
      role: "system",
      content:
        "This visitor is chatting without an account. After their first reply, mention once that a free member account saves their conversation so they can continue anytime — keep it brief; the UI also shows save prompts.",
    });
  }

  return [
    ...messages,
    ...session.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
  ];
};

const fallbackAssistantReply = (
  profile: ExtractedMaternalProfile,
  userMessage: string
): { content: string; quickReplies: string[] } => {
  const lower = userMessage.toLowerCase();
  if (!profile.maternalStage) {
    return {
      content:
        "Thank you for sharing. That helps me understand where you are. What ZIP code are you in? That helps me confirm what Nesting Place support we can offer near you.",
      quickReplies: FALLBACK_REPLIES.maternalStage,
    };
  }
  if (!profile.locationZip?.trim()) {
    return {
      content:
        "Got it. What's your ZIP code? I'll check our current coverage in your area.",
      quickReplies: [],
    };
  }
  if (!profile.supportInterests.length) {
    return {
      content:
        "Thank you for sharing. Which type of support from The Nesting Place feels most important right now — birth doula, postpartum care, overnight newborn care, lactation, or prenatal massage?",
      quickReplies: NESTING_PLACE_CONCIERGE_QUICK_REPLIES,
    };
  }
  if (!profile.challenges.length && !profile.challengesFreeText) {
    return {
      content:
        "I hear you. When would support typically work best for you — and do you prefer virtual or in-person?",
      quickReplies: FALLBACK_REPLIES.challenges,
    };
  }
  if (!profile.name || (!profile.phone && !profile.email)) {
    const missingName = !profile.name;
    const missingContact = !profile.phone && !profile.email;
    let content =
      "Almost there — so our care coordinator can follow up with personalized recommendations, ";
    if (missingName && missingContact) {
      content +=
        "could you share your name and the best email or phone number to reach you?";
    } else if (missingName) {
      content += "what name should we use for you?";
    } else {
      content +=
        "what's the best email or phone number for your care coordinator to reach you?";
    }
    return { content, quickReplies: [] };
  }
  if (lower.includes("done") || lower.includes("complete") || profile.readyToComplete) {
    return {
      content:
        "Thank you — I have what I need to personalize your care plan. I'll finalize your intake now.",
      quickReplies: [],
    };
  }
  return {
    content:
      "Thank you. Is there anything else you'd like your care coordinator to know before we wrap up?",
    quickReplies: ["That's everything", "Add one more thing"],
  };
};

async function* generateAssistantStream(
  session: ConversationSession
): AsyncGenerator<string, string, unknown> {
  if (!isOpenAiConfigured()) {
    const { content } = fallbackAssistantReply(
      session.extractedProfile,
      session.messages.at(-1)?.content ?? ""
    );
    yield content;
    return content;
  }

  let full = "";
  for await (const token of streamChatCompletion(await buildChatMessages(session))) {
    full += token;
    yield token;
  }
  return full;
}

export async function* processConversationMessageStream(
  session: ConversationSession,
  userMessage: string
): AsyncGenerator<
  | { type: "token"; value: string }
  | { type: "done"; session: ConversationSession; intakeSubmitted?: boolean },
  void,
  unknown
> {
  const now = new Date().toISOString();
  const userMsg: ConversationMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: userMessage,
    timestamp: now,
  };

  let profile = applyUserMessageHeuristics(
    userMessage,
    session.extractedProfile
  );
  session.messages.push(userMsg);

  if (detectSafetyEscalation(userMessage)) {
    session.safetyEscalation = true;
    session.extractedProfile = profile;
    const assistantMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: SAFETY_ESCALATION_REPLY,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(assistantMsg);
    session.quickReplies = ["I understand", "Contact care team"];
    session = await saveConversationSession(session);
    await upsertProfileDraft(
      session.userId,
      extractedProfileToIntakeDraft(profile)
    );
    yield { type: "done", session };
    return;
  }

  session.extractedProfile = profile;
  let assistantContent = "";
  for await (const token of generateAssistantStream(session)) {
    assistantContent += token;
    yield { type: "token", value: token };
  }

  if (!assistantContent) {
    const fallback = fallbackAssistantReply(profile, userMessage);
    assistantContent = fallback.content;
    session.quickReplies = fallback.quickReplies;
  }

  const assistantMsg: ConversationMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(assistantMsg);

  if (isOpenAiConfigured()) {
    const extracted = await extractProfileFromConversation(
      session.messages,
      profile
    );
    profile = extracted.profile;
    session.quickReplies =
      extracted.quickReplies.length > 0
        ? extracted.quickReplies
        : fallbackAssistantReply(profile, userMessage).quickReplies;
  } else {
    const fallback = fallbackAssistantReply(profile, userMessage);
    session.quickReplies = fallback.quickReplies;
  }

  session.extractedProfile = profile;
  await upsertProfileDraft(
    session.userId,
    extractedProfileToIntakeDraft(profile)
  );

  try {
    const { getIntakeForUser } = await import("@/lib/intake/storage");
    const intake = await getIntakeForUser(session.userId);
    await syncLeadFromIntake({
      userId: session.userId,
      intake: intake.profile,
      extracted: profile,
      conversationSessionId: session.id,
      hasSubmittedIntake: false,
    });
  } catch (leadError) {
    console.error("[conversation] lead sync failed:", leadError);
  }

  let intakeSubmitted = false;
  const wantsComplete = userWantsToCompleteIntake(userMessage);

  if (
    wantsComplete &&
    profile.maternalStage &&
    profile.name &&
    (profile.phone || profile.email) &&
    profile.supportInterests.length > 0
  ) {
    const draft = extractedProfileToIntakeDraft(profile);
    await submitProfile(session.userId, {
      ...draft,
      maternalStage: profile.maternalStage,
      supportInterests: profile.supportInterests,
    });
    try {
      const { getIntakeForUser } = await import("@/lib/intake/storage");
      const intake = await getIntakeForUser(session.userId);
      await syncLeadFromIntake({
        userId: session.userId,
        intake: intake.profile,
        extracted: profile,
        conversationSessionId: session.id,
        hasSubmittedIntake: true,
      });
    } catch (leadError) {
      console.error("[conversation] lead sync on submit failed:", leadError);
    }
    session.status = "completed";
    intakeSubmitted = true;
  } else if (wantsComplete) {
    session.quickReplies = [
      ...(session.quickReplies.length ? session.quickReplies : []),
      "Keep chatting",
    ];
  }

  session = await saveConversationSession(session);
  yield { type: "done", session, intakeSubmitted };
}

export const resumeOrCreateSession = async (
  userId: string,
  defaults: Partial<ExtractedMaternalProfile> = {},
  options: { forceNew?: boolean; preselectedService?: PreselectedService } = {}
) => {
  const { abandonActiveConversations, getActiveConversationForUser } =
    await import("@/lib/conversation/storage");

  if (options.forceNew) {
    await abandonActiveConversations(userId, defaults.email);
    return createConversationSession(userId, defaults, options.preselectedService);
  }

  const existing = await getActiveConversationForUser(userId, defaults.email);
  if (existing) {
    let extractedProfile = mergeExtractedProfile(existing.extractedProfile, {
      name: existing.extractedProfile.name || defaults.name || "",
      email: existing.extractedProfile.email || defaults.email || "",
      phone: existing.extractedProfile.phone || defaults.phone || "",
    });

    if (options.preselectedService) {
      extractedProfile = mergeExtractedProfile(extractedProfile, {
        supportInterests: Array.from(
          new Set([
            ...extractedProfile.supportInterests,
            options.preselectedService.supportInterest,
          ])
        ),
      });
    } else if (defaults.supportInterests?.length) {
      extractedProfile = mergeExtractedProfile(extractedProfile, {
        supportInterests: Array.from(
          new Set([
            ...extractedProfile.supportInterests,
            ...defaults.supportInterests,
          ])
        ),
      });
    }

    return {
      ...existing,
      extractedProfile,
    };
  }
  return createConversationSession(userId, defaults, options.preselectedService);
};
