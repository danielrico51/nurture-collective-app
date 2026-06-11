"use client";

import GuestSaveProgressPrompt from "@/components/Intake/GuestSaveProgressPrompt";
import SchedulingSlotPicker from "@/components/Intake/SchedulingSlotPicker";
import ChatMessageBubble from "@/components/Intake/chat/ChatMessageBubble";
import ProfileProgressBar from "@/components/Intake/chat/ProfileProgressBar";
import QuickReplyChips from "@/components/Intake/chat/QuickReplyChips";
import TypingIndicator from "@/components/Intake/chat/TypingIndicator";
import {
  buildGuestAccountSignupHref,
  INTAKE_SESSION_STORAGE_KEY,
  PUBLIC_INTAKE_PATH,
  resolveIntakeSessionStorageKey,
} from "@/config/intakeAccess";
import type { CareServiceContext } from "@/config/carePaths";
import { careCoordinator } from "@/content/site";
import {
  buildBookingPageHref,
  buildBookingUrlWithPrefill,
  hasBooking,
} from "@/config/bookings";
import {
  fetchConversation,
  sendConversationMessage,
  startConversation,
} from "@/lib/api/conversationClient";
import { fetchSchedulingStatus } from "@/lib/api/schedulingClient";
import type { ConsultBooking } from "@/lib/scheduling/types";
import { formatConversationStreamError } from "@/lib/conversation/errors";
import { canOfferScheduling } from "@/lib/conversation/profileMapper";
import { isGuestLead } from "@/lib/leads/workflow";
import { INTAKE_START_FRESH_EVENT } from "@/lib/intake/startFresh";
import type { ConversationMessage, ConversationSession } from "@/types/conversation";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface ConversationalIntakeProps {
  userId: string;
  defaults?: { name?: string; email?: string; phone?: string };
  guestMode?: boolean;
  initialService?: CareServiceContext | null;
}

const hasUserMessages = (items: ConversationMessage[]) =>
  items.some((message) => message.role === "user");

const isNearBottom = (container: HTMLDivElement, threshold = 120) => {
  const distanceFromBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceFromBottom < threshold;
};

const isStaleSessionError = (error: string) =>
  /session not found|missing or invalid x-guest-session-id/i.test(error);

const hasAssistantReplyAfterUserMessage = (
  items: ConversationMessage[],
  userContent: string
): boolean => {
  const trimmed = userContent.trim();
  const userIndex = items.findIndex(
    (message) => message.role === "user" && message.content.trim() === trimmed
  );
  if (userIndex < 0) return false;
  return items
    .slice(userIndex + 1)
    .some((message) => message.role === "assistant" && message.content.trim());
};

const applyProfileDefaults = (
  nextSession: ConversationSession,
  _defaults?: { name?: string; email?: string; phone?: string }
): ConversationSession => nextSession;

const isValidStoredSession = (
  stored: ConversationSession,
  userId: string,
  guestMode: boolean
) => {
  if (stored.userId !== userId) return false;
  if (!guestMode && isGuestLead(stored.userId)) return false;
  if (guestMode && !isGuestLead(stored.userId)) return false;
  return true;
};

const ConversationalIntake = ({
  userId,
  defaults,
  guestMode = false,
  initialService = null,
}: ConversationalIntakeProps) => {
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sessionClosed, setSessionClosed] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bookingSectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focusBookingFromLink, setFocusBookingFromLink] = useState(false);
  const initRef = useRef(false);
  const followLatestRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [liveSchedulingEnabled, setLiveSchedulingEnabled] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ConsultBooking | null>(
    null
  );

  useEffect(() => {
    void fetchSchedulingStatus().then((status) => {
      setLiveSchedulingEnabled(status.enabled);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("book") === "1") {
      setFocusBookingFromLink(true);
    }
  }, []);

  useEffect(() => {
    if (!focusBookingFromLink || !bookingSectionRef.current) return;
    bookingSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    stickToBottomRef.current = false;
  }, [focusBookingFromLink, messages, liveSchedulingEnabled, confirmedBooking]);

  const scrollMessagesToTop = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const syncStickToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const nearBottom = isNearBottom(container);
    stickToBottomRef.current = nearBottom;
    return nearBottom;
  }, []);

  const handleMessagesScroll = useCallback(() => {
    syncStickToBottom();
  }, [syncStickToBottom]);

  useEffect(() => {
    if (loading) return;
    if (hasUserMessages(messages)) {
      if (!syncStickToBottom()) return;
      scrollToBottom();
      return;
    }
    if (followLatestRef.current) {
      scrollToBottom();
      return;
    }
    scrollMessagesToTop();
  }, [loading, messages, scrollMessagesToTop, scrollToBottom, syncStickToBottom]);

  useEffect(() => {
    if (loading || !streamingText) return;
    if (!syncStickToBottom()) return;
    scrollToBottom();
  }, [loading, streamingText, scrollToBottom, syncStickToBottom]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setBootstrapError(null);

    const sessionStorageKey = resolveIntakeSessionStorageKey(guestMode, userId);

    try {
      if (typeof window !== "undefined") {
        // Guest and member intake used to share one key — never reuse a guest id on member routes.
        if (!guestMode) {
          window.sessionStorage.removeItem(INTAKE_SESSION_STORAGE_KEY);
        }
      }

      const storedSessionId =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(sessionStorageKey)
          : null;

      if (storedSessionId && !initialService) {
        try {
          const { session: stored, confirmedBooking: storedBooking } =
            await fetchConversation(storedSessionId);
          if (!isValidStoredSession(stored, userId, guestMode)) {
            window.sessionStorage.removeItem(sessionStorageKey);
            throw new Error("stale session");
          }
          const hydrated = applyProfileDefaults(stored, defaults);
          followLatestRef.current = hasUserMessages(hydrated.messages);
          setSession(hydrated);
          setMessages(hydrated.messages);
          setQuickReplies(hydrated.quickReplies);
          setConfirmedBooking(storedBooking);
          setSessionClosed(hydrated.status === "completed");
          if (hydrated.status === "completed") {
            followLatestRef.current = true;
          }
          return;
        } catch {
          window.sessionStorage.removeItem(sessionStorageKey);
        }
      } else if (initialService) {
        window.sessionStorage.removeItem(sessionStorageKey);
      }

      const { session: nextSession, quickReplies: replies } =
        await startConversation(
          { serviceSlug: initialService?.slug },
          { forceNew: Boolean(initialService) }
        );
      const hydrated = applyProfileDefaults(nextSession, defaults);
      followLatestRef.current = false;
      window.sessionStorage.setItem(sessionStorageKey, hydrated.id);
      setSession(hydrated);
      setMessages(hydrated.messages);
      setQuickReplies(replies);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start chat";
      setBootstrapError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [defaults, guestMode, initialService, userId]);

  useEffect(() => {
    if (!userId || initRef.current) return;
    initRef.current = true;
    void bootstrap();
  }, [bootstrap, userId]);

  const retryBootstrap = () => {
    initRef.current = false;
    void bootstrap();
  };

  const syncProfileAfterReply = useCallback(
    (sessionId: string) => {
      // Extraction finishes after the first stream "done" — refresh so booking UI can appear.
      window.setTimeout(() => {
        void fetchConversation(sessionId)
          .then(({ session: refreshed, confirmedBooking: booking }) => {
            const synced = applyProfileDefaults(refreshed, defaults);
            setSession(synced);
            setMessages(synced.messages);
            setQuickReplies(synced.quickReplies);
            setConfirmedBooking(booking);
          })
          .catch(() => undefined);
      }, 1500);
    },
    [defaults]
  );

  const handleComplete = useCallback(
    (nextSession: ConversationSession, intakeSubmitted?: boolean) => {
      const hydrated = applyProfileDefaults(nextSession, defaults);
      const sessionStorageKey = resolveIntakeSessionStorageKey(guestMode, userId);

      setSession(hydrated);
      setMessages(hydrated.messages);
      setQuickReplies(hydrated.quickReplies);
      followLatestRef.current = true;
      stickToBottomRef.current = true;
      window.sessionStorage.setItem(sessionStorageKey, hydrated.id);
      syncProfileAfterReply(hydrated.id);

      if (intakeSubmitted) {
        toast.success(
          guestMode
            ? "Your care profile is saved — book an introductory call below, or create a free account to keep your plan."
            : "Your care profile is ready — book an introductory call below when you're ready."
        );
        return;
      }

      if (hydrated.status === "completed") {
        setSessionClosed(true);
        toast(
          guestMode
            ? "This conversation is complete. Create a free account to save your plan, or book a call below."
            : "This conversation is complete. You can book a call below or continue in your apps."
        );
      }
    },
    [defaults, guestMode, syncProfileAfterReply, userId]
  );

  const syncSessionFromServer = useCallback(
    async (sessionId: string, attemptedMessage?: string) => {
      const { session: refreshed, confirmedBooking: booking } =
        await fetchConversation(sessionId);
      setSession(refreshed);
      setMessages(refreshed.messages);
      setQuickReplies(refreshed.quickReplies);
      setConfirmedBooking(booking);
      followLatestRef.current = hasUserMessages(refreshed.messages);
      const reopened = refreshed.status === "active";
      setSessionClosed(!reopened);
      const messageSaved = attemptedMessage
        ? refreshed.messages.some(
            (item) =>
              item.role === "user" && item.content.trim() === attemptedMessage
          )
        : false;
      return { refreshed, reopened, messageSaved };
    },
    []
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !session || sending || sessionClosed) return;

    followLatestRef.current = true;
    stickToBottomRef.current = true;
    setSending(true);
    setSendError(null);
    setInput("");
    setQuickReplies([]);
    setStreamingText("");

    const optimisticUser: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticUser]);

    const recoverFromSendFailure = async (
      error: string,
      optimisticId: string
    ) => {
      setStreamingText("");
      try {
        let { refreshed, messageSaved } = await syncSessionFromServer(
          session.id,
          trimmed
        );
        let assistantReplied = hasAssistantReplyAfterUserMessage(
          refreshed.messages,
          trimmed
        );

        if (!assistantReplied && messageSaved) {
          for (let attempt = 0; attempt < 4; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 750));
            const polled = await fetchConversation(session.id);
            refreshed = polled.session;
            setSession(refreshed);
            setMessages(refreshed.messages);
            setQuickReplies(refreshed.quickReplies);
            setConfirmedBooking(polled.confirmedBooking);
            assistantReplied = hasAssistantReplyAfterUserMessage(
              refreshed.messages,
              trimmed
            );
            if (assistantReplied) break;
          }
        }

        if (assistantReplied) {
          const hydrated = applyProfileDefaults(refreshed, defaults);
          setSession(hydrated);
          setMessages(hydrated.messages);
          setQuickReplies(hydrated.quickReplies);
          setSendError(null);
          syncProfileAfterReply(hydrated.id);
          return;
        }
        if (!messageSaved) {
          setMessages((current) =>
            current.filter((message) => message.id !== optimisticId)
          );
        }
        const friendly = formatConversationStreamError(error, { messageSaved });
        if (isStaleSessionError(error)) {
          window.sessionStorage.removeItem(
            resolveIntakeSessionStorageKey(guestMode, userId)
          );
        }
        setSendError(friendly);
        toast.error(friendly, { id: "concierge-send-error" });
      } catch {
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticId)
        );
        const friendly = formatConversationStreamError(error);
        if (isStaleSessionError(error)) {
          window.sessionStorage.removeItem(
            resolveIntakeSessionStorageKey(guestMode, userId)
          );
        }
        setSendError(friendly);
        toast.error(friendly, { id: "concierge-send-error" });
      }
    };

    try {
      const { doneReceived, errorHandled } = await sendConversationMessage(
        session.id,
        trimmed,
        {
          onToken: (token) => setStreamingText((current) => current + token),
          onDone: ({ session: nextSession, intakeSubmitted }) => {
            setStreamingText("");
            setSendError(null);
            handleComplete(nextSession, intakeSubmitted);
          },
          onError: async (error) => {
            await recoverFromSendFailure(error, optimisticUser.id);
          },
        }
      );

      if (!doneReceived && !errorHandled) {
        await recoverFromSendFailure(
          "The reply did not finish loading.",
          optimisticUser.id
        );
      }
    } catch (error) {
      await recoverFromSendFailure(
        error instanceof Error ? error.message : "Message failed",
        optimisticUser.id
      );
    } finally {
      setSending(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  const startFreshSession = useCallback(async () => {
    const sessionStorageKey = resolveIntakeSessionStorageKey(guestMode, userId);

    setLoading(true);
    setBootstrapError(null);
    setSessionClosed(false);
    setSending(false);
    setSendError(null);
    setStreamingText("");
    setInput("");
    setConfirmedBooking(null);
    followLatestRef.current = false;
    stickToBottomRef.current = true;
    window.sessionStorage.removeItem(sessionStorageKey);
    window.sessionStorage.removeItem(INTAKE_SESSION_STORAGE_KEY);
    initRef.current = true;
    try {
      const { session: nextSession, quickReplies: replies } =
        await startConversation({}, { forceNew: true });
      const hydrated = applyProfileDefaults(nextSession, defaults);
      window.sessionStorage.setItem(sessionStorageKey, hydrated.id);
      setSession(hydrated);
      setMessages(hydrated.messages);
      setQuickReplies(replies);
      toast.success("Started a new conversation");
    } catch (error) {
      initRef.current = false;
      toast.error(error instanceof Error ? error.message : "Could not start chat");
    } finally {
      setLoading(false);
    }
  }, [defaults, guestMode, userId]);

  useEffect(() => {
    const onStartFresh = () => {
      void startFreshSession();
    };
    window.addEventListener(INTAKE_START_FRESH_EVENT, onStartFresh);
    return () => window.removeEventListener(INTAKE_START_FRESH_EVENT, onStartFresh);
  }, [startFreshSession]);

  const showWelcomeIntro =
    !sessionClosed && messages.length === 1 && messages[0]?.role === "assistant";
  const showGuestSaveHint =
    guestMode && !sessionClosed && hasUserMessages(messages);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
        <p className="text-nurture-charcoal/60">{careCoordinator.intake.connecting}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-nurture-charcoal/70">
          {bootstrapError ??
            "We couldn't start your conversation. Check your connection and try again."}
        </p>
        <button
          type="button"
          onClick={retryBootstrap}
          className="rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  const profile = session.extractedProfile;
  const bookingAttendee = {
    name: profile.name?.trim() || defaults?.name?.trim() || "",
    email: profile.email?.trim() || defaults?.email?.trim() || "",
    phone: profile.phone?.trim() || defaults?.phone?.trim() || undefined,
  };
  const canOfferBooking =
    !confirmedBooking && canOfferScheduling(profile, messages);
  const canUseLiveScheduling =
    liveSchedulingEnabled && canOfferBooking && !confirmedBooking;
  const showBookCallCard =
    hasBooking() && canOfferBooking && !confirmedBooking;

  const handleBookingConfirmed = (booking: ConsultBooking) => {
    setConfirmedBooking(booking);
    stickToBottomRef.current = true;
    toast.success("Your introductory call is booked.");
  };

  const showStartFresh =
    !sessionClosed && !sending && (hasUserMessages(messages) || !guestMode);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden px-2 sm:max-w-4xl sm:px-4 lg:max-w-5xl">
      {(session?.extractedProfile.completionScore ?? 0) > 0 &&
      hasUserMessages(messages) ? (
        <ProfileProgressBar score={session.extractedProfile.completionScore} />
      ) : null}

      {showStartFresh ? (
        <div className="flex shrink-0 justify-end border-b border-nurture-sage/10 bg-white/70 px-4 py-2">
          <button
            type="button"
            onClick={() => void startFreshSession()}
            className="rounded-full border border-nurture-sage/30 bg-white px-3 py-1.5 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Start a new conversation
          </button>
        </div>
      ) : null}

      {sessionClosed ? (
        <div className="mx-4 mt-4 shrink-0 rounded-2xl border border-nurture-sage/20 bg-white/80 px-4 py-3 text-sm text-nurture-charcoal/80">
          <p className="font-medium text-nurture-charcoal">This intake conversation is closed.</p>
          <p className="mt-1">
            {guestMode
              ? "Create a free account to save this conversation and your care profile for next time."
              : "Your messages are saved. You can still book an introductory call below or head to your apps."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {guestMode ? (
              <Link
                href={buildGuestAccountSignupHref(PUBLIC_INTAKE_PATH)}
                className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Create free account
              </Link>
            ) : (
              <Link
                href="/apps"
                className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Go to apps
              </Link>
            )}
            <button
              type="button"
              onClick={startFreshSession}
              className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              Start a new conversation
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-4 [-webkit-overflow-scrolling:touch] sm:px-4 sm:py-6"
      >
        {showWelcomeIntro ? (
          <div className="mb-4 text-center sm:mb-6">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-nurture-sage/20 to-nurture-blush/30 text-lg sm:h-14 sm:w-14 sm:text-xl">
              ✦
            </div>
            <h1 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal sm:mt-4 sm:text-2xl">
              {careCoordinator.intake.title}
            </h1>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-nurture-charcoal/65">
              A calm, private space to share where you are — we&apos;ll build your
              personalized care profile together.
            </p>
            {guestMode ? null : (
              <GuestSaveProgressPrompt
                variant="card"
                className="mx-auto mt-4 max-w-md sm:mt-5"
              />
            )}
          </div>
        ) : null}

        <div className="space-y-4">
          {messages.map((message, index) => {
            if (
              showWelcomeIntro &&
              index === 0 &&
              message.role === "assistant"
            ) {
              return null;
            }
            return (
            <ChatMessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              content={message.content}
            />
            );
          })}
          {streamingText ? (
            <ChatMessageBubble
              role="assistant"
              content={streamingText}
              streaming
            />
          ) : null}
          {sending && !streamingText ? <TypingIndicator /> : null}

          {confirmedBooking ? (
            <div className="rounded-2xl border border-nurture-sage/25 bg-nurture-sage/5 p-4">
              <p className="text-sm font-medium text-nurture-charcoal">
                Introductory call confirmed
              </p>
              <p className="mt-1 text-xs text-nurture-charcoal/70">
                {new Date(confirmedBooking.start).toLocaleString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: confirmedBooking.timezone,
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {confirmedBooking.htmlLink ? (
                  <a
                    href={confirmedBooking.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-nurture-sage-dark underline-offset-2 hover:underline"
                  >
                    Add to Google Calendar
                  </a>
                ) : null}
                {confirmedBooking.meetLink ? (
                  <a
                    href={confirmedBooking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-nurture-sage-dark underline-offset-2 hover:underline"
                  >
                    Open Google Meet link
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <div ref={bookingSectionRef}>
            {focusBookingFromLink && canOfferBooking && !confirmedBooking ? (
              <div className="mb-3 rounded-2xl border border-nurture-sage/25 bg-nurture-sage/5 px-4 py-3 text-sm text-nurture-charcoal/80">
                Pick an open time below for your introductory call — we&apos;ll
                send a calendar invite to your email.
              </div>
            ) : null}

            {canUseLiveScheduling && !confirmedBooking ? (
              <SchedulingSlotPicker
                conversationSessionId={session.id}
                attendee={bookingAttendee}
                onBooked={handleBookingConfirmed}
              />
            ) : null}

            {showBookCallCard ? (
              <div className="rounded-2xl border border-nurture-sage/20 bg-white/90 p-4 text-center">
              <p className="text-sm font-medium text-nurture-charcoal">
                Book your introductory call
              </p>
              <p className="mt-1 text-xs text-nurture-charcoal/60">
                {canUseLiveScheduling
                  ? "Prefer the full calendar? Open our booking page to see every open time."
                  : "Pick a time that works for you — our care coordinator will confirm by email."}
              </p>
              <a
                href={buildBookingUrlWithPrefill({
                  name: bookingAttendee.name || undefined,
                  email: bookingAttendee.email || undefined,
                }) ?? buildBookingPageHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-full bg-nurture-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Book a call
              </a>
            </div>
            ) : null}
          </div>
          <div ref={messagesEndRef} aria-hidden className="h-px shrink-0" />
        </div>
      </div>

      <div className="shrink-0 border-t border-nurture-sage/10 bg-gradient-to-t from-nurture-cream via-nurture-cream/95 to-nurture-cream/80 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        {sendError ? (
          <div
            role="alert"
            className="mb-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-nurture-charcoal/85"
          >
            <p>{sendError}</p>
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-nurture-sage-dark hover:underline"
              onClick={() => setSendError(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}
        {showGuestSaveHint ? (
          <GuestSaveProgressPrompt
            variant="compact"
            className="mb-2"
            showStartFresh
          />
        ) : null}
        <QuickReplyChips
          options={quickReplies}
          disabled={sending || sessionClosed}
          onSelect={sendMessage}
        />

        <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
          <label htmlFor="care-coordinator-input" className="sr-only">
            {careCoordinator.intake.inputLabel}
          </label>
          <textarea
            id="care-coordinator-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={
              sessionClosed
                ? "This conversation is closed"
                : "Share what's on your mind…"
            }
            disabled={sending || sessionClosed}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-nurture-sage/30 bg-white px-4 py-3 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || sessionClosed || !input.trim()}
            className="shrink-0 rounded-full bg-nurture-sage px-5 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-50"
          >
            Send
          </button>
        </form>

        {session?.extractedProfile.readyToComplete && !sessionClosed ? (
          <button
            type="button"
            disabled={sending}
            onClick={() => sendMessage("That's everything — please complete my intake")}
            className="mt-3 w-full rounded-full border border-nurture-sage/30 py-2.5 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
          >
            Complete my care profile
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ConversationalIntake;
