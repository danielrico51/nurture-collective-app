"use client";

import {
  fetchChannelMessages,
  fetchCommunityChannels,
  markChannelRead,
  sendChannelMessage,
  type ChatMessage,
} from "@/lib/api/communityMessagingApi";
import { getCommunityWsBaseUrl } from "@/lib/community/config";
import { useCallback, useEffect, useRef, useState } from "react";

interface CommunityChatProps {
  communityId: string;
  isMember: boolean;
  demoMode?: boolean;
}

export function CommunityChat({
  communityId,
  isMember,
  demoMode = false,
}: CommunityChatProps) {
  const [channelId, setChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"off" | "connecting" | "live">("off");
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seenIds = useRef(new Set<string>());

  const appendMessage = useCallback((msg: ChatMessage) => {
    if (seenIds.current.has(msg.message_id)) return;
    seenIds.current.add(msg.message_id);
    setMessages((prev) => [...prev, msg]);
  }, []);

  const loadHistory = useCallback(
    async (cid: string) => {
      const { messages: history } = await fetchChannelMessages(cid);
      seenIds.current.clear();
      history.forEach((m) => seenIds.current.add(m.message_id));
      setMessages(history);
      const last = history[history.length - 1];
      if (last) {
        await markChannelRead(cid, last.message_id).catch(() => undefined);
      }
    },
    []
  );

  const connectWebSocket = useCallback(
    async (cid: string) => {
      const wsBase = getCommunityWsBaseUrl();
      if (!wsBase) {
        setWsStatus("off");
        return;
      }

      const { fetchAuthSession } = await import("aws-amplify/auth");
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      wsRef.current?.close();
      setWsStatus("connecting");

      const ws = new WebSocket(
        `${wsBase}/ws/messaging/${cid}/?token=${encodeURIComponent(token)}`
      );
      wsRef.current = ws;

      ws.onopen = () => setWsStatus("live");
      ws.onclose = () => setWsStatus("off");
      ws.onerror = () => setWsStatus("off");
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "message.new" && data.payload) {
            appendMessage(data.payload as ChatMessage);
          }
        } catch {
          /* ignore malformed frames */
        }
      };
    },
    [appendMessage]
  );

  useEffect(() => {
    if (!isMember || demoMode) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const boot = async () => {
      setLoading(true);
      setError(null);
      try {
        const { results } = await fetchCommunityChannels(communityId);
        const general =
          results.find((c) => c.name === "General") ?? results[0];
        if (!general) {
          throw new Error("Discussion channel is not available yet.");
        }
        if (cancelled) return;

        setChannelId(general.channel_id);
        await loadHistory(general.channel_id);
        if (cancelled) return;
        await connectWebSocket(general.channel_id);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load discussion"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [communityId, isMember, demoMode, loadHistory, connectWebSocket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !channelId || sending) return;

    setSending(true);
    setError(null);
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "message.send", body: text, metadata: {} })
        );
      } else {
        const msg = await sendChannelMessage(channelId, text);
        appendMessage(msg);
      }
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  if (!isMember) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-nurture-sage/30 bg-nurture-cream/40 p-6">
        <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Discussions
        </h2>
        <p className="mt-2 text-sm text-nurture-charcoal/70">
          Join this community to participate in group conversations.
        </p>
      </section>
    );
  }

  if (demoMode) {
    return (
      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Discussions
        </h2>
        <p className="mt-2 text-sm text-amber-900">
          Live chat is available when connected to community-service (not preview
          mode).
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
          General discussion
        </h2>
        <span className="text-xs text-nurture-charcoal/50">
          {wsStatus === "live"
            ? "Live"
            : wsStatus === "connecting"
              ? "Connecting…"
              : "REST fallback"}
        </span>
      </div>

      <div className="mt-4 flex h-[min(420px,55vh)] flex-col overflow-hidden rounded-2xl border border-nurture-sage/20 bg-white shadow-sm">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-nurture-charcoal/60">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-nurture-charcoal/60">
              No messages yet. Say hello to the group.
            </p>
          ) : (
            messages.map((msg) => (
              <article key={msg.message_id} className="text-sm">
                <p className="font-medium text-nurture-sage-dark">
                  {msg.sender_name || "Member"}
                </p>
                <p className="mt-1 leading-relaxed text-nurture-charcoal/80">
                  {msg.message}
                </p>
                <p className="mt-1 text-[10px] text-nurture-charcoal/45">
                  {new Date(msg.timestamp).toLocaleString()}
                </p>
              </article>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-nurture-sage/15 p-3"
        >
          {error ? (
            <p className="mb-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              disabled={loading || !channelId}
              className="min-w-0 flex-1 rounded-full border border-nurture-sage/20 px-4 py-2.5 text-sm outline-none focus:border-nurture-sage"
              maxLength={4000}
            />
            <button
              type="submit"
              disabled={loading || sending || !draft.trim() || !channelId}
              className="shrink-0 rounded-full bg-nurture-sage px-5 py-2.5 text-sm font-medium text-white hover:bg-nurture-sage-dark disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
