"use client";

import ChatMessageBubble from "@/components/Intake/chat/ChatMessageBubble";
import TypingIndicator from "@/components/Intake/chat/TypingIndicator";
import { sendEventDigestQuestion } from "@/lib/api/eventDigestClient";
import type { EventDigestHistoryMessage, EventKind } from "@/types/event";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DigestMessage = EventDigestHistoryMessage & { id: string };

const renderDigestContent = (content: string) => {
  const parts = content.split(/(\/events-and-classes\/[a-z0-9-]+)/gi);
  return parts.map((part, index) => {
    if (/^\/events-and-classes\/[a-z0-9-]+$/i.test(part)) {
      const slug = part.replace(/^\/events-and-classes\//i, "");
      const label = slug.replace(/-/g, " ");
      return (
        <Link
          key={`${part}-${index}`}
          href={part}
          className="font-semibold text-nurture-sage-dark underline decoration-nurture-sage/40 underline-offset-2 hover:text-nurture-sage"
        >
          {label}
        </Link>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
};

const DigestMessageBody = ({
  role,
  content,
  streaming = false,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) => {
  if (role === "user") {
    return (
      <ChatMessageBubble role="user" content={content} streaming={streaming} />
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[min(100%,28rem)] rounded-2xl rounded-bl-md border border-nurture-sage/15 bg-white px-4 py-3.5 text-base leading-relaxed text-nurture-charcoal shadow-sm sm:max-w-[85%] sm:py-3 sm:text-sm">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-nurture-sage-dark">
          Class guide
        </p>
        <p className="whitespace-pre-wrap">{renderDigestContent(content)}</p>
        {streaming ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-nurture-sage" />
        ) : null}
      </div>
    </div>
  );
};

interface EventDigestProps {
  slug: string;
  title: string;
  kind: EventKind;
}

export function EventDigest({ slug, title, kind }: EventDigestProps) {
  const quickPrompts = useMemo(
    () =>
      kind === "class"
        ? [
            `What will I learn in ${title}?`,
            "How do I register and pay for this class?",
            "What is your refund and cancellation policy?",
            "What should I bring or prepare?",
          ]
        : [
            `What happens at ${title}?`,
            "How do I register for this event?",
            "What is your refund and cancellation policy?",
            "Is this event in person or virtual?",
          ],
    [kind, title]
  );

  const welcomeMessage = useMemo(
    () =>
      kind === "class"
        ? `Hi — I'm your class guide for "${title}". Ask about what we'll cover, how to register, fees, or our FAQ. I'll answer from this listing and our class policies.`
        : `Hi — I'm your events guide for "${title}". Ask about what to expect, registration, or policies. I'll answer from this listing and our site information.`,
    [kind, title]
  );

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<DigestMessage[]>([
    { id: "welcome", role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const panelId = `event-digest-panel-${slug}`;

  const scrollToBottom = useCallback(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    if (!expanded) return;
    scrollToBottom();
  }, [expanded, messages, streamingText, sending, scrollToBottom]);

  const askQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    setExpanded(true);
    setError(null);
    setSending(true);
    setStreamingText("");

    const userMessage: DigestMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const history = [...messages, userMessage]
      .filter((message) => message.id !== "welcome")
      .map(({ role, content }) => ({ role, content }));

    let answer = "";
    await sendEventDigestQuestion(slug, trimmed, history, {
      onToken: (token) => {
        answer += token;
        setStreamingText(answer);
      },
      onDone: () => {
        const finalAnswer =
          answer.trim() || "I couldn't find an answer in our listing just yet.";
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: finalAnswer },
        ]);
        setStreamingText("");
        setSending(false);
      },
      onError: (message) => {
        setError(message);
        setStreamingText("");
        setSending(false);
      },
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void askQuestion(input);
  };

  return (
    <section
      aria-labelledby={`event-digest-heading-${slug}`}
      className="mt-10 overflow-hidden rounded-2xl border border-nurture-sage/20 bg-gradient-to-br from-white via-nurture-cream/40 to-nurture-blush/20 shadow-sm"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/50 sm:px-5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nurture-sage/15 text-base">
          ✦
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id={`event-digest-heading-${slug}`}
            className="font-serif text-lg font-semibold text-nurture-charcoal sm:text-xl"
          >
            Ask about this {kind === "class" ? "class" : "event"}
          </h2>
          <p className="mt-0.5 truncate text-sm text-nurture-charcoal/65">
            {expanded
              ? "Get answers from this listing, FAQ, and our class policies."
              : "Tap to ask questions — registration, what to expect, refunds, and more."}
          </p>
        </div>
        <span
          className={`shrink-0 text-nurture-sage-dark transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {expanded ? (
        <div id={panelId}>
          <div className="border-t border-nurture-sage/15 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sending}
                  onClick={() => void askQuestion(prompt)}
                  className="rounded-full border border-nurture-sage/25 bg-white px-3 py-1.5 text-left text-xs font-medium text-nurture-charcoal/80 transition hover:border-nurture-sage/45 hover:bg-nurture-sage/5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={messagesRef}
            className="max-h-64 overflow-y-auto border-t border-nurture-sage/10 px-4 py-4 sm:px-5"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <DigestMessageBody
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {streamingText ? (
                <DigestMessageBody
                  role="assistant"
                  content={streamingText}
                  streaming
                />
              ) : null}
              {sending && !streamingText ? <TypingIndicator /> : null}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-nurture-sage/15 bg-white/70 px-4 py-4 sm:px-5"
          >
            {error ? (
              <p className="mb-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="sr-only" htmlFor={`event-digest-input-${slug}`}>
                Ask about this {kind}
              </label>
              <textarea
                id={`event-digest-input-${slug}`}
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void askQuestion(input);
                  }
                }}
                placeholder="e.g. How do I register and what does the class fee include?"
                disabled={sending}
                maxLength={500}
                className="min-h-[2.75rem] flex-1 resize-y rounded-2xl border border-nurture-sage/20 bg-white px-4 py-2.5 text-sm text-nurture-charcoal outline-none transition focus:border-nurture-sage"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Thinking…" : "Ask"}
              </button>
            </div>
            <p className="mt-2 text-xs text-nurture-charcoal/50">
              For urgent or personal medical concerns, contact your care provider
              or call 911. For registration help, call us directly.
            </p>
          </form>
        </div>
      ) : null}
    </section>
  );
}
