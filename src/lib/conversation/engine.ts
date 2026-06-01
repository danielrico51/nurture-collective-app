import {
  applyUserMessageHeuristics,
  extractProfileFromConversation,
} from "@/lib/conversation/extraction";
import {
  extractedProfileToIntakeDraft,
  mergeExtractedProfile,
} from "@/lib/conversation/profileMapper";
import { NESTING_PLACE_CONCIERGE_QUICK_REPLIES } from "@/content/nestingPlaceServices";
import { formatServiceAreaForConcierge } from "@/lib/coverage/concierge";
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
  "Hi — I'm your support coordinator for The Nesting Place. I'm here to help connect you with the right support — birth doula, postpartum help, lactation, overnight newborn care, or prenatal massage. There's no rush. How far along are you in your motherhood journey?";

const BIRTH_DOULA_WELCOME =
  "Hi — I'm your support coordinator for The Nesting Place. I see you're interested in birth doula support. How far along are you in your pregnancy?";

const buildWelcomeMessage = (
  userId: string,
  preselectedService?: PreselectedService
) => {
  const base =
    preselectedService?.supportInterest === "birth-doula"
      ? BIRTH_DOULA_WELCOME
      : preselectedService
        ? `Hi — I'm your support coordinator for The Nesting Place. I see you're interested in ${preselectedService.title.toLowerCase()} — I'll help connect you with the right support. How far along are you in your motherhood journey?`
        : WELCOME_MESSAGE;
  return isGuestLead(userId) ? `${base}${GUEST_WELCOME_SUFFIX}` : base;
};

const DEFAULT_QUICK_REPLIES = [
  "Pregnant",
  "Newly postpartum",
  "Infant care",
];

const BIRTH_DOULA_QUICK_REPLIES = ["First trimester", "Second trimester", "Third trimester"];

const FALLBACK_REPLIES: Record<string, string[]> = {
  start: DEFAULT_QUICK_REPLIES,
  maternalStage: [
    "Pregnant",
    "Newly postpartum",
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
  preselectedService?: PreselectedService,
  skipWelcome = false
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
    quickReplies:
      preselectedService?.supportInterest === "birth-doula"
        ? BIRTH_DOULA_QUICK_REPLIES
        : DEFAULT_QUICK_REPLIES,
    safetyEscalation: false,
    createdAt: now,
    updatedAt: now,
  };

  if (!skipWelcome) {
    const welcome: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: buildWelcomeMessage(userId, preselectedService),
      timestamp: now,
    };
    session.messages.push(welcome);
  }
  return saveConversationSession(session);
};

type ConversationChannelOptions = {
  smsMode?: boolean;
};

const buildChatMessages = async (
  session: ConversationSession,
  options: ConversationChannelOptions = {}
) => {
  const profile = session.extractedProfile;
  const needsContact =
    !profile.name.trim() || (!profile.phone.trim() && !profile.email.trim());

  const serviceAreaPrompt = formatServiceAreaForConcierge(profile.locationZip);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: CONCIERGE_SYSTEM_PROMPT },
    { role: "system", content: serviceAreaPrompt },
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

  if (options.smsMode) {
    messages.push({
      role: "system",
      content:
        "The user is texting via SMS. Keep replies concise (under 320 characters when possible). Use plain text only — no markdown, bullets, or links unless essential. On the first reply, briefly introduce yourself as their Nesting Place support coordinator.",
    });
  } else if (isGuestLead(session.userId)) {
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
        "Thank you for sharing. That helps me understand where you are in your journey. What kind of support are you looking for right now?",
      quickReplies: FALLBACK_REPLIES.maternalStage,
    };
  }
  if (!profile.locationZip?.trim()) {
    const declinedZip =
      /prefer not|don't want to share|rather not|skip.*zip/i.test(userMessage);
    if (declinedZip) {
      return {
        content:
          "No problem — we can still help. What would be most useful to know about our support?",
        quickReplies: [],
      };
    }
    return {
      content:
        "If you're comfortable sharing your ZIP code, it helps our team with scheduling — but it's completely optional.",
      quickReplies: ["Prefer not to share ZIP"],
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
  session: ConversationSession,
  options: ConversationChannelOptions = {}
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
  for await (const token of streamChatCompletion(
    await buildChatMessages(session, options)
  )) {
    full += token;
    yield token;
  }
  return full;
}

export async function* processConversationMessageStream(
  session: ConversationSession,
  userMessage: string,
  options: ConversationChannelOptions = {}
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
  for await (const token of generateAssistantStream(session, options)) {
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

export const processConversationMessage = async (
  session: ConversationSession,
  userMessage: string,
  options: ConversationChannelOptions = {}
): Promise<{
  session: ConversationSession;
  assistantReply: string;
  intakeSubmitted?: boolean;
}> => {
  let assistantReply = "";
  let resultSession = session;
  let intakeSubmitted = false;

  for await (const event of processConversationMessageStream(
    session,
    userMessage,
    options
  )) {
    if (event.type === "token") {
      assistantReply += event.value;
    }
    if (event.type === "done") {
      resultSession = event.session;
      intakeSubmitted = event.intakeSubmitted ?? false;
      if (!assistantReply) {
        const lastAssistant = event.session.messages
          .filter((message) => message.role === "assistant")
          .at(-1);
        assistantReply = lastAssistant?.content ?? "";
      }
    }
  }

  return { session: resultSession, assistantReply, intakeSubmitted };
};

export const resumeOrCreateSession = async (
  userId: string,
  defaults: Partial<ExtractedMaternalProfile> = {},
  options: {
    forceNew?: boolean;
    preselectedService?: PreselectedService;
    skipWelcome?: boolean;
  } = {}
) => {
  const { abandonActiveConversations, getActiveConversationForUser } =
    await import("@/lib/conversation/storage");
  const {
    getLatestIncompleteCompletedSession,
    reactivateConversationIfIncomplete,
  } = await import("@/lib/conversation/sessionLifecycle");

  if (options.forceNew) {
    await abandonActiveConversations(userId, defaults.email);
    return createConversationSession(
      userId,
      defaults,
      options.preselectedService,
      options.skipWelcome
    );
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

  const incompleteCompleted = await getLatestIncompleteCompletedSession(
    userId,
    defaults.email
  );
  if (incompleteCompleted) {
    const reopened = await reactivateConversationIfIncomplete(incompleteCompleted);
    return {
      ...reopened,
      extractedProfile: mergeExtractedProfile(reopened.extractedProfile, {
        name: reopened.extractedProfile.name || defaults.name || "",
        email: reopened.extractedProfile.email || defaults.email || "",
        phone: reopened.extractedProfile.phone || defaults.phone || "",
      }),
    };
  }

  return createConversationSession(
    userId,
    defaults,
    options.preselectedService,
    options.skipWelcome
  );
};
