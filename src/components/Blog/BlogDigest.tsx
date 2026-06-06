"use client";

import ChatMessageBubble from "@/components/Intake/chat/ChatMessageBubble";
import TypingIndicator from "@/components/Intake/chat/TypingIndicator";
import { sendBlogDigestQuestion } from "@/lib/api/blogDigestClient";
import type { BlogDigestHistoryMessage } from "@/types/blog";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const QUICK_PROMPTS = [
  "What are the key takeaways across these articles?",
  "Which articles should I read if I'm preparing for birth?",
  "Summarize postpartum self-care tips from the blog",
  "What support does The Nesting Place offer new moms?",
] as const;

const WELCOME_MESSAGE =
  "Hi — I'm your blog guide. Ask for summaries, key points, or which articles fit your stage. I'll point you to stories from our library.";

type DigestMessage = BlogDigestHistoryMessage & { id: string };

const renderDigestContent = (content: string) => {
  const parts = content.split(/(\/blog\/[a-z0-9-]+)/gi);
  return parts.map((part, index) => {
    if (/^\/blog\/[a-z0-9-]+$/i.test(part)) {
      const slug = part.replace(/^\/blog\//i, "");
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
          Blog guide
        </p>
        <p className="whitespace-pre-wrap">{renderDigestContent(content)}</p>
        {streaming ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-nurture-sage" />
        ) : null}
      </div>
    </div>
  );
};

interface BlogDigestProps {
  articleCount: number;
}

export function BlogDigest({ articleCount }: BlogDigestProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<DigestMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelId = "blog-digest-panel";

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
    if (!trimmed || sending || articleCount === 0) return;

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
    await sendBlogDigestQuestion(trimmed, history, {
      onToken: (token) => {
        answer += token;
        setStreamingText(answer);
      },
      onDone: () => {
        const finalAnswer = answer.trim() || "I couldn't find an answer in our articles just yet.";
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
      aria-labelledby="blog-digest-heading"
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
            id="blog-digest-heading"
            className="font-serif text-lg font-semibold text-nurture-charcoal sm:text-xl"
          >
            AI blog digest
          </h2>
          <p className="mt-0.5 truncate text-sm text-nurture-charcoal/65">
            {expanded
              ? "Ask for summaries, key points, or article recommendations."
              : "Tap to ask questions about our articles — summaries & key points."}
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
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sending || articleCount === 0}
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
            {articleCount === 0 ? (
              <p className="text-sm text-nurture-charcoal/60">
                Articles are on the way — the digest will be ready once posts are
                published.
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="sr-only" htmlFor="blog-digest-input">
                  Ask about the blog
                </label>
                <textarea
                  id="blog-digest-input"
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void askQuestion(input);
                    }
                  }}
                  placeholder="e.g. What should I read about breastfeeding support?"
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
            )}
            <p className="mt-2 text-xs text-nurture-charcoal/50">
              For urgent or personal medical concerns, contact your care provider
              or call 911.
            </p>
          </form>
        </div>
      ) : null}
    </section>
  );
}
