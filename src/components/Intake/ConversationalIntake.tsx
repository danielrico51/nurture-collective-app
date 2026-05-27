"use client";

import GuestSaveProgressPrompt from "@/components/Intake/GuestSaveProgressPrompt";
import ChatMessageBubble from "@/components/Intake/chat/ChatMessageBubble";
import ProfileProgressBar from "@/components/Intake/chat/ProfileProgressBar";
import QuickReplyChips from "@/components/Intake/chat/QuickReplyChips";
import TypingIndicator from "@/components/Intake/chat/TypingIndicator";
import {
  buildGuestAccountSignupHref,
  PUBLIC_INTAKE_PATH,
} from "@/config/intakeAccess";
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
import type { ConversationMessage, ConversationSession } from "@/types/conversation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface ConversationalIntakeProps {
  userId: string;
  defaults?: { name?: string; email?: string; phone?: string };
  guestMode?: boolean;
}

const SESSION_STORAGE_KEY = "nurture-intake-session-id";

const hasUserMessages = (items: ConversationMessage[]) =>
  items.some((message) => message.role === "user");

const ConversationalIntake = ({
  userId,
  defaults,
  guestMode = false,
}: ConversationalIntakeProps) => {
  const router = useRouter();
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sessionClosed, setSessionClosed] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef(false);
  const followLatestRef = useRef(false);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const scrollMessagesToTop = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const syncScrollPosition = useCallback(() => {
    if (followLatestRef.current || hasUserMessages(messages)) {
      scrollMessagesToBottom(streamingText || sending ? "auto" : "smooth");
      return;
    }
    scrollMessagesToTop();
  }, [messages, scrollMessagesToBottom, scrollMessagesToTop, sending, streamingText]);

  useEffect(() => {
    if (loading) return;
    syncScrollPosition();
  }, [loading, messages, streamingText, sending, syncScrollPosition]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const bootstrap = async () => {
      try {
        const storedSessionId =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(SESSION_STORAGE_KEY)
            : null;

        if (storedSessionId) {
          try {
            const stored = await fetchConversation(storedSessionId);
            followLatestRef.current = hasUserMessages(stored.messages);
            if (stored.status === "active") {
              setSession(stored);
              setMessages(stored.messages);
              setQuickReplies(stored.quickReplies);
              return;
            }
            if (stored.status === "completed") {
              setSession(stored);
              setMessages(stored.messages);
              setQuickReplies([]);
              setSessionClosed(true);
              followLatestRef.current = true;
              return;
            }
          } catch {
            window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }

        const { session: nextSession, quickReplies: replies } =
          await startConversation(defaults);
        followLatestRef.current = false;
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextSession.id);
        setSession(nextSession);
        setMessages(nextSession.messages);
        setQuickReplies(replies);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not start chat");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [defaults, userId]);

  const handleComplete = useCallback(
    (nextSession: ConversationSession, intakeSubmitted?: boolean) => {
      setSession(nextSession);
      setMessages(nextSession.messages);
      setQuickReplies(nextSession.quickReplies);
      followLatestRef.current = true;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextSession.id);

      if (intakeSubmitted) {
        toast.success(
          guestMode
            ? "Your care profile is saved — create a free account to keep it, or book a follow-up call."
            : "Your care profile is ready — welcome!"
        );
        if (!guestMode) {
          router.push("/dashboard");
        }
        return;
      }

      if (nextSession.status === "completed") {
        setSessionClosed(true);
        toast(
          guestMode
            ? "This conversation is complete. Create a free account to save your plan, or book a call below."
            : "This conversation was marked complete. You can review it below or continue on your dashboard."
        );
      }
    },
    [guestMode, router]
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !session || sending || sessionClosed) return;

    followLatestRef.current = true;
    setSending(true);
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

    try {
      await sendConversationMessage(session.id, trimmed, {
        onToken: (token) => setStreamingText((current) => current + token),
        onDone: ({ session: nextSession, intakeSubmitted }) => {
          setStreamingText("");
          handleComplete(nextSession, intakeSubmitted);
        },
        onError: async (error) => {
          setStreamingText("");
          toast.error(error);
          try {
            const refreshed = await fetchConversation(session.id);
            setSession(refreshed);
            setMessages(refreshed.messages);
            setQuickReplies(refreshed.quickReplies);
            followLatestRef.current = hasUserMessages(refreshed.messages);
            if (refreshed.status === "completed") {
              setSessionClosed(true);
            }
          } catch {
            /* keep optimistic UI */
          }
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message failed");
    } finally {
      setSending(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  const startFreshSession = async () => {
    setLoading(true);
    setSessionClosed(false);
    followLatestRef.current = false;
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    initRef.current = false;
    try {
      const { session: nextSession, quickReplies: replies } =
        await startConversation(defaults, { forceNew: true });
      initRef.current = true;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextSession.id);
      setSession(nextSession);
      setMessages(nextSession.messages);
      setQuickReplies(replies);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start chat");
    } finally {
      setLoading(false);
    }
  };

  const showWelcomeIntro =
    !sessionClosed && messages.length === 1 && messages[0]?.role === "assistant";
  const showGuestSaveHint =
    guestMode && !sessionClosed && hasUserMessages(messages);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-nurture-charcoal/60">Connecting with your concierge…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col overflow-hidden">
      <ProfileProgressBar score={session?.extractedProfile.completionScore ?? 0} />

      {sessionClosed ? (
        <div className="mx-4 mt-4 shrink-0 rounded-2xl border border-nurture-sage/20 bg-white/80 px-4 py-3 text-sm text-nurture-charcoal/80">
          <p className="font-medium text-nurture-charcoal">This intake conversation is closed.</p>
          <p className="mt-1">
            {guestMode
              ? "Create a free account to save this conversation and your care profile for next time."
              : "Your messages are saved. If your profile was submitted, head to your dashboard for next steps."}
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
                href="/dashboard"
                className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Go to dashboard
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6"
      >
        {showWelcomeIntro ? (
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-nurture-sage/20 to-nurture-blush/30 text-xl">
              ✦
            </div>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-nurture-charcoal">
              Your care concierge
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-nurture-charcoal/65">
              A calm, private space to share where you are — we&apos;ll build your
              personalized care profile together.
            </p>
            {guestMode ? (
              <GuestSaveProgressPrompt variant="card" className="mx-auto mt-5 max-w-md" />
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              content={message.content}
            />
          ))}
          {streamingText ? (
            <ChatMessageBubble
              role="assistant"
              content={streamingText}
              streaming
            />
          ) : null}
          {sending && !streamingText ? <TypingIndicator /> : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-nurture-sage/10 bg-gradient-to-t from-nurture-cream via-nurture-cream/95 to-nurture-cream/80 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        {showGuestSaveHint ? (
          <GuestSaveProgressPrompt variant="compact" className="mb-2" />
        ) : null}
        <QuickReplyChips
          options={quickReplies}
          disabled={sending || sessionClosed}
          onSelect={sendMessage}
        />

        <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
          <label htmlFor="concierge-input" className="sr-only">
            Message your concierge
          </label>
          <textarea
            id="concierge-input"
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

        {guestMode && hasBooking() ? (
          <div className="mt-3 rounded-2xl border border-nurture-sage/20 bg-white/90 p-4 text-center">
            <p className="text-sm font-medium text-nurture-charcoal">
              Ready for a human touch?
            </p>
            <p className="mt-1 text-xs text-nurture-charcoal/60">
              Book a follow-up call with our client coordinator.
            </p>
            <a
              href={buildBookingUrlWithPrefill() ?? buildBookingPageHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full bg-nurture-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
            >
              Book a call
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ConversationalIntake;
