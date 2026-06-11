import {
  createConversationSession,
  processConversationMessage,
  resumeOrCreateSession,
} from "@/lib/conversation/engine";
import { canOfferScheduling } from "@/lib/conversation/profileMapper";
import { ensureSmsBookingLink } from "@/lib/conversation/smsBooking";
import { formatAssistantReplyForSms } from "@/lib/conversation/smsFormatting";
import {
  detectSmsKeywordAction,
  SMS_HELP_REPLY,
  SMS_START_REPLY,
  SMS_STOP_REPLY,
} from "@/lib/conversation/smsKeywords";
import { phoneToSmsGuestUserId } from "@/lib/conversation/smsIdentity";
import {
  clearSmsOptOut,
  isSmsOptedOut,
  recordSmsOptOut,
} from "@/lib/conversation/smsOptOut";
import { saveConversationSession } from "@/lib/conversation/storage";
import { normalizePhone } from "@/lib/intake/submitService";

export type InboundSmsPayload = {
  from: string;
  body: string;
  messageSid?: string;
};

export type InboundSmsResult = {
  reply: string;
  skipped?: boolean;
  reason?: string;
};

export const handleInboundSms = async (
  payload: InboundSmsPayload
): Promise<InboundSmsResult> => {
  const fromPhone = normalizePhone(payload.from);
  const body = payload.body.trim();

  if (!fromPhone) {
    return { reply: "", skipped: true, reason: "missing_from_phone" };
  }

  if (!body) {
    return {
      reply: "Thanks for texting The Nesting Place. How can we support you today?",
    };
  }

  const keywordAction = detectSmsKeywordAction(body);
  if (keywordAction === "stop") {
    await recordSmsOptOut(fromPhone);
    return { reply: SMS_STOP_REPLY };
  }
  if (keywordAction === "start") {
    await clearSmsOptOut(fromPhone);
    return { reply: SMS_START_REPLY };
  }
  if (keywordAction === "help") {
    return { reply: SMS_HELP_REPLY };
  }

  if (await isSmsOptedOut(fromPhone)) {
    return { reply: "", skipped: true, reason: "opted_out" };
  }

  const userId = phoneToSmsGuestUserId(fromPhone);
  const sessionDefaults = {
    phone: fromPhone,
    smsConsent: true,
  };

  let session: Awaited<ReturnType<typeof resumeOrCreateSession>>;
  try {
    session = await resumeOrCreateSession(userId, sessionDefaults, {
      skipWelcome: true,
    });

    if (session.status === "completed") {
      session = await resumeOrCreateSession(
        userId,
        {
          ...sessionDefaults,
          name: session.extractedProfile.name,
          email: session.extractedProfile.email,
        },
        { forceNew: true, skipWelcome: true }
      );
    }
  } catch (error) {
    console.error("[smsConcierge] session resume failed, starting fresh:", error);
    session = await createConversationSession(
      userId,
      sessionDefaults,
      undefined,
      true
    );
  }

  const startedAt = Date.now();
  const { session: updatedSession, assistantReply, intakeSubmitted } =
    await processConversationMessage(session, body, { smsMode: true });
  console.info("[smsConcierge] reply ready", {
    userId,
    ms: Date.now() - startedAt,
    replyLength: assistantReply.length,
  });

  let reply = formatAssistantReplyForSms(assistantReply);

  if (
    canOfferScheduling(
      updatedSession.extractedProfile,
      updatedSession.messages
    )
  ) {
    reply = ensureSmsBookingLink(reply);
  }

  if (intakeSubmitted) {
    reply =
      `${reply}\n\nThank you — your intake is complete. A care coordinator will follow up soon. Reply anytime if you need more help.`.trim();
  }

  if (!reply) {
    reply =
      "Thanks for reaching out to The Nesting Place. A coordinator will follow up shortly.";
  }

  if (!updatedSession.extractedProfile.smsConsent) {
    await saveConversationSession({
      ...updatedSession,
      extractedProfile: {
        ...updatedSession.extractedProfile,
        smsConsent: true,
        phone: fromPhone,
      },
    });
  }

  return { reply };
};
