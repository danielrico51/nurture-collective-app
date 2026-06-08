import {
  applyUserMessageHeuristics,
  extractProfileFromConversation,
} from "@/lib/conversation/extraction";
import {
  canOfferScheduling,
  extractedProfileToIntakeDraft,
  hasBookingContact,
  mergeExtractedProfile,
  profileForLlmContext,
  scrubUnverifiedContactFromProfile,
} from "@/lib/conversation/profileMapper";
import { NESTING_PLACE_CONCIERGE_QUICK_REPLIES } from "@/content/nestingPlaceServices";
import { formatServiceAreaForConcierge } from "@/lib/coverage/concierge";
import { CONCIERGE_SYSTEM_PROMPT } from "@/lib/conversation/prompts";
import {
  detectSafetyEscalation,
  SAFETY_ESCALATION_REPLY,
} from "@/lib/conversation/safety";
import { userWantsToCompleteIntake } from "@/lib/conversation/completion";
import { sanitizeQuickReplies } from "@/lib/conversation/quickReplies";
import { isGuestLead } from "@/lib/leads/workflow";
import { syncLeadFromIntake } from "@/lib/leads/storage";
import { saveConversationSession } from "@/lib/conversation/storage";
import { isOpenAiConfigured, streamChatCompletion } from "@/lib/openai/client";
import { upsertProfileDraft, submitProfile } from "@/lib/intake/storage";
import { formatConsultBookingSummary } from "@/lib/scheduling/bookingSummary";
import { findConfirmedBookingForConversation } from "@/lib/scheduling/storage";
import type { ConsultBooking } from "@/lib/scheduling/types";
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

const setQuickReplies = (
  session: ConversationSession,
  replies: string[]
): void => {
  session.quickReplies = sanitizeQuickReplies(replies);
};

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

  const extractedProfile = mergeExtractedProfile(createEmptyExtractedProfile(), {
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
  options: ConversationChannelOptions = {},
  confirmedBooking: ConsultBooking | null = null
) => {
  const profile = profileForLlmContext(
    session.extractedProfile,
    session.messages
  );
  const needsContact = !profile.name.trim() || !profile.email.trim();
  const offerScheduling =
    !confirmedBooking && canOfferScheduling(profile, session.messages);

  const serviceAreaPrompt = formatServiceAreaForConcierge(profile.locationZip);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: CONCIERGE_SYSTEM_PROMPT },
    {
      role: "system",
      content:
        "CONVERSATION CONTEXT: Use only user and assistant messages in THIS thread. Do not use account login data, prior sessions, browser storage, or guesses. If name or email are blank in the profile snapshot, the user has not provided them yet — do not invent or assume them.",
    },
    { role: "system", content: serviceAreaPrompt },
    {
      role: "system",
      content: `Current extracted profile for this thread only (background — may omit unverified contact): ${JSON.stringify(profile)}`,
    },
  ];

  if (confirmedBooking) {
    messages.push({
      role: "system",
      content: `INTRODUCTORY CALL ALREADY BOOKED: ${formatConsultBookingSummary(confirmedBooking)}. Do NOT ask the user to book again, do NOT mention the scheduler or "Book a call" below, and do NOT say they still need to pick a time. If they ask about next steps, confirm the call is scheduled, mention they should have a calendar invite, and explain we will use that call to discuss support options. Offer to answer questions before the call.`,
    });
  } else if (!offerScheduling) {
    messages.push({
      role: "system",
      content:
        "Do NOT invite the user to book a call or mention the scheduler below yet. Focus on understanding their stage, support needs, and (when appropriate) collecting name and email. Phone is optional. Booking is only offered after maternal stage, support interests, name, and email are collected through the conversation.",
    });
  }

  if (needsContact) {
    messages.push({
      role: "system",
      content:
        "PRIORITY: Before booking or completing intake, collect the user's name and email address (phone optional). Ask one piece at a time. Email is required for calendar invites.",
    });
  } else if (offerScheduling) {
    messages.push({
      role: "system",
      content:
        'SCHEDULING (required next step): Name, email, stage, and support interests are on file. Invite the user to book an introductory call using the scheduler directly below this chat — e.g. "pick a time below" or "tap Book a call below." Do NOT say we will email them to schedule or that someone will reach out to schedule.',
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
  userMessage: string,
  messages: ConversationMessage[] = [],
  confirmedBooking: ConsultBooking | null = null
): { content: string; quickReplies: string[] } => {
  const lower = userMessage.toLowerCase();
  if (confirmedBooking) {
    const when = new Date(confirmedBooking.start).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: confirmedBooking.timezone,
    });
    if (/next step|what happens|what now|after the call/i.test(lower)) {
      return {
        content: `Your introductory call is already booked for ${when}. You should have a calendar invite at ${confirmedBooking.attendeeEmail}. On that call, our team will learn more about your needs and walk through postpartum support options. Is there anything you'd like us to know before then?`,
        quickReplies: ["That's all for now", "Add a note for the team"],
      };
    }
    if (/book|schedule|introductory call|pick a time/i.test(lower)) {
      return {
        content: `You're all set — your introductory call is already booked for ${when}. Check your email for the calendar invite${confirmedBooking.meetLink ? " and Google Meet link" : ""}.`,
        quickReplies: [],
      };
    }
    return {
      content: `Your introductory call is confirmed for ${when}. We'll use that time to discuss your support needs in detail. What else can I help you with before then?`,
      quickReplies: ["That's all for now", "Add a note for the team"],
    };
  }
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
        "If you're comfortable sharing your ZIP code, it helps our team with scheduling — but it's completely optional. You can share it here or let me know you'd like to skip.",
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
  if (!hasBookingContact(profile)) {
    const missingName = !profile.name.trim();
    const missingEmail = !profile.email.trim();
    let content =
      "Almost there — so we can send your calendar invite and follow up, ";
    if (missingName && missingEmail) {
      content += "could you share your name and email address?";
    } else if (missingName) {
      content += "what name should we use for you?";
    } else {
      content += "what email address should we use for your calendar invite?";
    }
    return { content, quickReplies: [] };
  }
  if (!canOfferScheduling(profile, messages)) {
    return {
      content:
        "Thank you — I have your details saved. Is there anything else you'd like your care coordinator to know?",
      quickReplies: ["That's everything", "Add one more thing"],
    };
  }
  if (lower.includes("done") || lower.includes("complete") || profile.readyToComplete) {
    return {
      content:
        "Thank you — I have what I need to personalize your care plan. I'll finalize your intake now. You can also book an introductory call using the scheduling options below whenever you're ready.",
      quickReplies: ["Book an introductory call"],
    };
  }
  if (/book|schedule|introductory call|set up a call/i.test(lower)) {
    return {
      content:
        "Absolutely — use the scheduling options just below this chat to pick an open time for your introductory call. We'll send a calendar invite to the email you provided.",
      quickReplies: [],
    };
  }
  return {
    content:
      "Thank you — I have your contact details saved. When you're ready, book a free introductory call with our team using the scheduling options below. Is there anything else you'd like your care coordinator to know before we wrap up?",
    quickReplies: [
      "Book an introductory call",
      "That's everything",
      "Add one more thing",
    ],
  };
};

async function* generateAssistantStream(
  session: ConversationSession,
  options: ConversationChannelOptions = {},
  confirmedBooking: ConsultBooking | null = null
): AsyncGenerator<string, string, unknown> {
  if (!isOpenAiConfigured()) {
    const { content } = fallbackAssistantReply(
      session.extractedProfile,
      session.messages.at(-1)?.content ?? "",
      session.messages,
      confirmedBooking
    );
    yield content;
    return content;
  }

  let full = "";
  for await (const token of streamChatCompletion(
    await buildChatMessages(session, options, confirmedBooking)
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

  session.messages.push(userMsg);
  let profile = scrubUnverifiedContactFromProfile(
    applyUserMessageHeuristics(userMessage, session.extractedProfile),
    session.messages
  );
  session.extractedProfile = profile;
  session = await saveConversationSession(session);

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
    setQuickReplies(session, ["I understand", "Contact care team"]);
    session = await saveConversationSession(session);
    await upsertProfileDraft(
      session.userId,
      extractedProfileToIntakeDraft(profile)
    );
    yield { type: "done", session };
    return;
  }

  const confirmedBooking = await findConfirmedBookingForConversation(
    session.userId,
    session.id
  );

  let assistantContent = "";
  for await (const token of generateAssistantStream(
    session,
    options,
    confirmedBooking
  )) {
    assistantContent += token;
    yield { type: "token", value: token };
  }

  if (!assistantContent) {
    const fallback = fallbackAssistantReply(
      profile,
      userMessage,
      session.messages,
      confirmedBooking
    );
    assistantContent = fallback.content;
    setQuickReplies(session, fallback.quickReplies);
  }

  const assistantMsg: ConversationMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(assistantMsg);

  const initialFallback = fallbackAssistantReply(
    profile,
    userMessage,
    session.messages,
    confirmedBooking
  );
  setQuickReplies(session, initialFallback.quickReplies);
  session.extractedProfile = profile;

  if (!confirmedBooking && canOfferScheduling(profile, session.messages)) {
    const bookingChip = "Book an introductory call";
    const replies = session.quickReplies.filter((reply) => reply !== bookingChip);
    setQuickReplies(session, [bookingChip, ...replies]);
  }

  // Finish the visible reply before profile extraction / lead sync so the stream
  // closes promptly (post-processing can exceed hosting timeouts).
  session = await saveConversationSession(session);
  yield { type: "done", session, intakeSubmitted: false };

  let intakeSubmitted = false;
  try {
    if (isOpenAiConfigured()) {
      const extracted = await extractProfileFromConversation(
        session.messages,
        profileForLlmContext(profile, session.messages)
      );
      profile = scrubUnverifiedContactFromProfile(
        extracted.profile,
        session.messages
      );
      setQuickReplies(
        session,
        extracted.quickReplies.length > 0
          ? extracted.quickReplies
          : initialFallback.quickReplies
      );
    }

    session.extractedProfile = profile;

    const bookingAfterExtract = await findConfirmedBookingForConversation(
      session.userId,
      session.id
    );
    if (
      !bookingAfterExtract &&
      canOfferScheduling(profile, session.messages)
    ) {
      const bookingChip = "Book an introductory call";
      const replies = session.quickReplies.filter((reply) => reply !== bookingChip);
      setQuickReplies(session, [bookingChip, ...replies]);
    }

    try {
      await upsertProfileDraft(
        session.userId,
        extractedProfileToIntakeDraft(profile)
      );
    } catch (draftError) {
      console.error("[conversation] profile draft sync failed:", draftError);
    }

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

    const wantsComplete = userWantsToCompleteIntake(userMessage);

    if (
      wantsComplete &&
      profile.maternalStage &&
      profile.name &&
      (profile.phone || profile.email) &&
      profile.supportInterests.length > 0
    ) {
      try {
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
      } catch (submitError) {
        console.error("[conversation] intake submit failed:", submitError);
        setQuickReplies(session, [
          "Try completing again",
          ...(session.quickReplies.length ? session.quickReplies : ["Keep chatting"]),
        ]);
      }
    } else if (wantsComplete) {
      setQuickReplies(session, [
        ...(session.quickReplies.length ? session.quickReplies : []),
        "Keep chatting",
      ]);
    }

    session = await saveConversationSession(session);
    yield { type: "done", session, intakeSubmitted };
  } catch (postProcessError) {
    console.error("[conversation] post-reply enrichment failed:", postProcessError);
  }
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
    let extractedProfile = scrubUnverifiedContactFromProfile(
      existing.extractedProfile,
      existing.messages
    );

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
      extractedProfile: scrubUnverifiedContactFromProfile(
        reopened.extractedProfile,
        reopened.messages
      ),
    };
  }

  return createConversationSession(
    userId,
    defaults,
    options.preselectedService,
    options.skipWelcome
  );
};
